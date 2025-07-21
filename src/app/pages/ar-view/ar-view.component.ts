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

  ngAfterViewInit(): void {
    //this.startCamera().then(() => this.setupScene());
  }

  async startCamera(): Promise<void> {
    const video = this.videoRef.nativeElement;
    console.log("📸 Trying to access camera...");
  
    // ✅ Check if mediaDevices and getUserMedia are available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("❌ Camera API not supported or page not served over HTTPS");
      alert("Camera not supported or must be served over HTTPS.");
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, // Try to use rear camera
        audio: false,
      });
  
      video.srcObject = stream;
      await video.play();
      console.log("✅ Camera stream started");
    } catch (error) {
      console.error("❌ Failed to start camera:", error);
      alert("Camera access failed: " + (error as any).message);
    }
  }
  
  

  // ✅ Setup THREE.js scene
  setupScene(): void {
    const canvas = this.canvasRef.nativeElement;
  
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  
    const scene = new THREE.Scene();
  
    // ✅ Set a non-transparent background to debug if needed (optional)
    // scene.background = new THREE.Color(0x202020);
  
    // ✅ Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10); // ⬅️ Raise the camera higher
    camera.lookAt(0, 0, 0);        // ⬅️ Look at the origin
  
    // ✅ Grid helper (visible under arrow)
    const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x888888); // brighter colors
    scene.add(grid);
  
    // ✅ Arrow pointing forward
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      5,
      0xff0000 // red for visibility
    );
    scene.add(arrow);
  
    // ✅ Stronger directional light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
  
    // ✅ Ambient light for soft illumination
    const ambient = new THREE.AmbientLight(0x404040); 
    scene.add(ambient);
  
    // ✅ Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  }
  
}
