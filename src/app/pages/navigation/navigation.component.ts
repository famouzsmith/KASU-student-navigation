import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router} from '@angular/router';

import * as L from 'leaflet'; // ✅ First, import Leaflet
import 'leaflet-routing-machine'; // ✅ Then import Leaflet Routing Machine


// Fix the missing Leaflet marker icons (404 errors)
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css',
})
export class NavigationComponent implements AfterViewInit {
  map!: L.Map; // Declare map
  mapInitialized = false; // Track if map is already created

  userLat = 10.51679; // KASU default latitude
  userLng = 7.45052; // KASU default longitude

  userLocationMarker: L.Marker | null = null; // ✅ Add this
  currentRouteLine: L.Polyline | null = null; // ✅ Add this
  routeLine: L.Polyline | null = null;
  selectedBuilding: any = null;
  userLocation: L.LatLng | null = null;
  routingControl: any; // fallback type to avoid TypeScript error
  isLoading = false;



  buildingMarkers: { [name: string]: L.Marker } = {};

  // Example campus markers
  campusLocations = [
    {
      name: 'Faculty of Science',
    lat: 10.51620,
      lng: 7.45075,
      description: 'CBN Building',
    },
    {
      name: 'ICT Center',
      lat: 10.51714,
      lng: 7.44963,
      description: 'ICT training, CBT exams.',
    },
  ];

  ngAfterViewInit(): void {
    if (this.mapInitialized) return;

    // Initialize the map and center it on KASU with high zoom
    this.map = L.map('map').setView([this.userLat, this.userLng], 20); // max detailed zoom

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19, // ensure tile layer supports it
    }).addTo(this.map);

    // Only show the KASU location marker
    L.marker([this.userLat, this.userLng])
      .addTo(this.map)
      .bindPopup('Kaduna State University')
      .openPopup();

    // Add and store building markers
    this.campusLocations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng])
        .addTo(this.map)
        .bindPopup(loc.name);

      this.buildingMarkers[loc.name] = marker; // store for later
    });

    this.mapInitialized = true;
  }
  constructor(private router: Router) {} // ⬅️ Inject the Router here

  goToARView(): void {
    if (this.selectedBuilding) {
      this.router.navigate(['/ar-view'], {
        state: { destination: this.selectedBuilding }
      });
    } else {
      alert('Please select a destination first.');
    }
  }
  
  

  clearRoute(): void {
    // Remove the routing line/control if it exists
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
  
    // Remove the selected building info
    this.selectedBuilding = null;
  
    // Reset the dropdown to "Select a building"
    const selector: HTMLSelectElement | null = document.getElementById('locationSelect') as HTMLSelectElement;
    if (selector) {
      selector.selectedIndex = 0;
    }
  
    // Optionally reset map view to user location
    if (this.userLocation) {
      this.map.setView(this.userLocation, 18, { animate: true });
    }
  }
  

  resetMap(): void {
    // Clear selected building info
    this.selectedBuilding = null;
  
    // Remove the route line if exists
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null!;
    }
  
    // Center back to user location if available
    if (this.userLocation) {
      this.map.setView(this.userLocation, 18, { animate: true });
    } else {
      // If user location not available, go to KASU default
      this.map.setView([this.userLat, this.userLng], 18);
    }
  }
  
  

  goToLocation(buildingName: string): void {
    if (!this.userLocation) {
      alert('⚠️ Please click "Locate Me" first to get your current location.');
      return;
    }
  
    const marker = this.buildingMarkers[buildingName];
    const selected = this.campusLocations.find(loc => loc.name === buildingName);
  
    if (!marker || !this.map || !selected) {
      console.warn('No marker found for:', buildingName);
      return;
    }
  
    this.selectedBuilding = selected;
  
    // Fly to marker and open popup
    this.map.setView(marker.getLatLng(), 19, { animate: true });
    marker.openPopup();
  
    // Clear previous route if exists
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null!;
    }
  
    // ✅ Create new routing control
    this.routingControl = L.Routing.control({
      waypoints: [
        L.latLng(this.userLocation.lat, this.userLocation.lng),
        L.latLng(selected.lat, selected.lng)
      ],
      lineOptions: {
        styles: [
          {
            color: 'blue',
            weight: 5,
            dashArray: '6, 8'
          }
        ]
      },
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      createMarker: () => null,
      position: 'bottomleft'
    }).addTo(this.map);
  
  }
  

  locateUser(): void {
    if (!this.map) return;

    this.isLoading = true; //Before location start

    this.map.locate({ setView: true, maxZoom: 19 });

    this.map.on('locationfound', (e: L.LocationEvent) => {
      this.isLoading = false; //after location found or fail

      // Clear previous marker
      if (this.userLocationMarker) {
        this.map.removeLayer(this.userLocationMarker);
      }

      this.userLocation = e.latlng; // Save current location
      this.userLocationMarker = L.marker(e.latlng)
      L.marker(e.latlng)
        .addTo(this.map!)
        .bindPopup('You are here now')
        .openPopup();

    });

    this.map.once('locationerror', () => {
      alert('❌ Unable to access your location');
    });
  }
}
