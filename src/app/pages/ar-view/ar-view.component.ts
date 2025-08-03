import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as THREE from 'three';
import { Line, LineDashedMaterial, BufferGeometry } from 'three';

@Component({
  selector: 'app-ar-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ar-view.component.html',
  styleUrls: ['./ar-view.component.css'],
})
export class ArViewComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  destination: { lat: number; lng: number } | null = null;
  destinationName: string = 'Your Destination';
  distanceToTarget: number = 0;

  arrow!: THREE.ArrowHelper;
  dottedLine!: THREE.Line;
  labelMesh!: THREE.Sprite;
  destinationMarker: THREE.Mesh | null = null;
  lastBearing: number | null = null;
  heading: number = 0;
  showArrivalLabel: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['destination']) {
      this.destination = nav.extras.state['destination'];
      this.destinationName = nav.extras.state['name'] || 'Your Destination';
    }
  }

  ngAfterViewInit(): void {
    this.startCamera().then(() => {
      this.setupScene();
      this.startGPS();
    });

    window.addEventListener('deviceorientationabsolute', (event: any) => {
      if (event.absolute && event.alpha !== null) {
        this.heading = 360 - event.alpha;
      }
    });
  }

  async startCamera(): Promise<void> {
    const video = this.videoRef.nativeElement;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      console.log('✅ Camera started');
    } catch (err) {
      console.error('❌ Camera error:', err);
      alert('Could not access the camera. Please allow camera permission.');
    }
  }

  goBack(): void {
    this.router.navigate(['/navigation']);
  }

  setupScene(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    const arrowDirection = new THREE.Vector3(0, 0, -1);
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    this.arrow = new THREE.ArrowHelper(arrowDirection, arrowOrigin, 5, 0x00ff00);
    this.scene.add(this.arrow);

    this.createDottedLine();
    //this.updateLabel("To Destination ⬆️");

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x404040));

    this.animate();
  }

  createDottedLine(): void {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)];
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.3,
      gapSize: 0.2,
      linewidth: 1,
    });
    this.dottedLine = new Line(geometry, material);
    this.dottedLine.computeLineDistances();
    this.scene.add(this.dottedLine);
  }

  animate(): void {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  startGPS(): void {
    if (!navigator.geolocation) {
      alert('Geolocation not supported on this device.');
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('📍 Current position:', lat, lng);

        if (this.destination) {
          const distance = this.calculateDistance(lat, lng, this.destination.lat, this.destination.lng);
          this.distanceToTarget = distance;

          const bearing = this.calculateBearing(lat, lng, this.destination.lat, this.destination.lng);
          const angle = (bearing - this.heading + 360) % 360;

          const radians = THREE.MathUtils.degToRad(angle);
          const dir = new THREE.Vector3(Math.sin(radians), 0, -Math.cos(radians)).normalize();
          this.arrow.setDirection(dir);

          const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(5)];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          this.dottedLine.geometry.dispose();
          this.dottedLine.geometry = geometry;
          this.dottedLine.computeLineDistances();

          this.updateLabel(`${this.destinationName}\n${distance.toFixed(1)} meters`);

          // ✅ Distance-based marker & label toggle logic
          if (distance <= 30) {
            if (!this.destinationMarker) {
              this.add3DDestinationMarker();
            }
            this.showArrivalLabel = true;
          } else {
            if (this.destinationMarker) {
              this.camera.remove(this.destinationMarker);
              this.destinationMarker = null;
            }
            this.showArrivalLabel = false;
          }
          
        }
      },
      (err) => {
        console.error('❌ GPS error:', err);
        alert('Failed to get your location. Enable GPS and try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 1000,
      }
    );
  }

  add3DDestinationMarker(): void {
    const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.destinationMarker = new THREE.Mesh(geometry, material);
    this.destinationMarker.position.set(0, 1, -5); // in front of camera
    this.camera.add(this.destinationMarker);
    console.log('🚩 Destination marker added');
  }

  updateLabel(text: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    ctx.fillText(text, 20, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    if (this.labelMesh) {
      this.labelMesh.material.map = texture;
      this.labelMesh.material.needsUpdate = true;
    } else {
      this.labelMesh = new THREE.Sprite(material);
      this.labelMesh.scale.set(6, 1.5, 1);
      this.labelMesh.position.set(0, 6, 0);
      this.scene.add(this.labelMesh);
    }
  }

  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = THREE.MathUtils.degToRad(lat1);
    const φ2 = THREE.MathUtils.degToRad(lat2);
    const Δλ = THREE.MathUtils.degToRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    return (THREE.MathUtils.radToDeg(θ) + 360) % 360;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const φ1 = THREE.MathUtils.degToRad(lat1);
    const φ2 = THREE.MathUtils.degToRad(lat2);
    const Δφ = φ2 - φ1;
    const Δλ = THREE.MathUtils.degToRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  
}
