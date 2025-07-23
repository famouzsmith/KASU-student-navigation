import { Router } from '@angular/router';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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

  destination: { lat: number; lng: number; name?: string } | null = null;
  arrow!: THREE.ArrowHelper;

  currentPosition: { lat: number; lng: number } | null = null;
  currentDistance: number = 0;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['destination']) {
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
    } catch (error) {
      console.error('❌ Failed to start camera:', error);
      alert('Camera access failed: ' + (error as any).message);
    }
  }

  goBack(): void {
    this.router.navigate(['/navigation']);
  }

  setupScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x888888);
    scene.add(grid);

    this.arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      5,
      0xff0000
    );
    scene.add(this.arrow);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  }

  startGPS(): void {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser.');
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.currentPosition = { lat, lng };
        console.log('📍 Current Position:', lat, lng);

        if (this.destination) {
          const bearing = this.calculateBearing(lat, lng, this.destination.lat, this.destination.lng);
          console.log('🧭 Bearing to destination:', bearing.toFixed(2), 'degrees');

          const rad = THREE.MathUtils.degToRad(bearing);
          const dir = new THREE.Vector3(Math.sin(rad), 0, -Math.cos(rad));
          this.arrow.setDirection(dir.normalize());

          // 🧮 Update distance
          this.currentDistance = this.calculateDistance(lat, lng, this.destination.lat, this.destination.lng);
          console.log('📏 Distance to destination:', this.currentDistance.toFixed(2), 'meters');
        }
      },
      (error) => {
        console.error('❌ GPS Error:', error);
        alert('Failed to get GPS position. Please allow location access.');
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
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (THREE.MathUtils.radToDeg(θ) + 360) % 360;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = THREE.MathUtils.degToRad(lat1);
    const φ2 = THREE.MathUtils.degToRad(lat2);
    const Δφ = THREE.MathUtils.degToRad(lat2 - lat1);
    const Δλ = THREE.MathUtils.degToRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
