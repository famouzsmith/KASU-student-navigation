import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-ar-view',
  standalone: true,
  templateUrl: './ar-view.component.html',
  styleUrls: ['./ar-view.component.css'],
})
export class ArViewComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  destination: { lat: number; lng: number } | null = null;
  arrow!: THREE.ArrowHelper;
  labelMesh!: THREE.Sprite;
  lastBearing: number | null = null;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state && nav.extras.state['destination']) {
      this.destination = nav.extras.state['destination'];
      console.log('📌 Destination received:', this.destination);
    }
  }

  ngAfterViewInit(): void {
    this.startCamera().then(() => {
      this.setupScene();
      this.startGPS();
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
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // 🔴 Arrow
    const arrowDirection = new THREE.Vector3(0, 0, -1);
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    this.arrow = new THREE.ArrowHelper(arrowDirection, arrowOrigin, 5, 0xff0000);
    scene.add(this.arrow);

    // 🟩 Label sprite
    const canvas2 = document.createElement('canvas');
    canvas2.width = 256;
    canvas2.height = 64;
    const ctx = canvas2.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('To Destination ⬆️', 20, 40);

    const texture = new THREE.CanvasTexture(canvas2);
    const material = new THREE.SpriteMaterial({ map: texture });
    this.labelMesh = new THREE.Sprite(material);
    this.labelMesh.scale.set(4, 1, 1);
    this.labelMesh.position.set(0, 6, 0);
    scene.add(this.labelMesh);

    // 💡 Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // 🎞️ Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
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
        console.log('📍 Your position:', lat, lng);

        if (this.destination) {
          const bearing = this.calculateBearing(lat, lng, this.destination.lat, this.destination.lng);
          if (this.lastBearing === null || Math.abs(bearing - this.lastBearing) > 5) {
            console.log('🧭 New bearing:', bearing.toFixed(2), '°');
            this.lastBearing = bearing;

            const rad = THREE.MathUtils.degToRad(bearing);
            const dir = new THREE.Vector3(Math.sin(rad), 0, -Math.cos(rad)).normalize();
            this.arrow.setDirection(dir);
          }
        }
      },
      (err) => {
        console.error('❌ GPS Error:', err);
        alert('Failed to get your location. Please enable GPS.');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
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
}
