import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterModule } from '@angular/router';

import * as L from 'leaflet'; // First, import Leaflet
import 'leaflet-routing-machine'; // Then import Leaflet Routing Machine

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
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css',
})
export class NavigationComponent implements AfterViewInit {
  map!: L.Map; // Declare map
  mapInitialized = false; // Track if map is already created

  userLocationMarker: L.Marker | null = null;
  currentRouteLine: L.Polyline | null = null;
  routeLine: L.Polyline | null = null;
  selectedBuilding: any = null;
  userLocation: L.LatLng | null = null;
  routingControl: any; // fallback type to avoid TypeScript error
  isLoading = false;
  userLocationCircle: L.Circle | null = null;

  buildingMarkers: { [name: string]: L.Marker } = {};

  userLat = 10.51679; // KASU default latitude
  userLng = 7.45052; // KASU default longitude

  // Example campus markers
  campusLocations = [
    {
      name: 'Faculty of Science',
      lat: 10.5164,
      lng: 7.4506,
      description: 'CBN Building',
    },
    {
      name: 'ICT Center',
      lat: 10.51714,
      lng: 7.44963,
      description: 'ICT training, CBT exams.',
    },
    {
      name: 'SLT 1',
      lat: 10.51591,
      lng: 7.44949,
      description: 'Science Lecture Theatre 1',
    },
    {
      name: 'Faculty of Computing',
      lat: 10.51591,
      lng: 7.4499,
      description: 'Department of Informatics',
    },
    {
      name: 'Multipurpose Lab',
      lat: 10.51584,
      lng: 7.45044,
      description: 'Lab',
    },
    {
      name: 'Convo',
      lat: 10.51589,
      lng: 7.44891,
      description: 'Convocation Ground KASU',
    },
    {
      name: 'Library',
      lat: 10.5181,
      lng: 7.44941,
      description: 'Central Library',
    },
    {
      name: 'E-Library',
      lat: 10.518,
      lng: 7.44983,
      description: 'Digital Library',
    },
    {
      name: 'IT Park',
      lat: 10.5187,
      lng: 7.44983,
      description: 'IT Park',
    },
    {
      name: '1000 Capacity',
      lat: 10.51666,
      lng: 7.44944,
      description: '1k Seaters',
    },
    {
      name: 'Mathematical Science',
      lat: 10.5154,
      lng: 7.4505,
      description: 'Dept of Mathematics',
    },
    {
      name: 'Faculty Social and Manage.',
      lat: 10.51489,
      lng: 7.45192,
      description: 'Social and Management Science',
    },
    {
      name: 'Dental Center',
      lat: 10.5177,
      lng: 7.4483,
      description: 'Kasu Dental',
    },
    {
      name: 'Registry',
      lat: 10.518,
      lng: 7.449,
      description: 'Office of the Registrar',
    },
    {
      name: 'VC Complex',
      lat: 10.51807,
      lng: 7.4488,
      description: 'Office of the Vice Chancelor',
    },
    {
      name: 'Kasu Consult',
      lat: 10.51705,
      lng: 7.44903,
      description: 'Consultancy Service',
    },
    {
      name: 'Field',
      lat: 10.51713,
      lng: 7.4506,
      description: 'Football Field/Parking Lot',
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
        state: { destination: this.selectedBuilding },
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
    const selector: HTMLSelectElement | null = document.getElementById(
      'locationSelect'
    ) as HTMLSelectElement;
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
    const selected = this.campusLocations.find(
      (loc) => loc.name === buildingName
    );

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

    // Create new routing control
    this.routingControl = L.Routing.control({
      waypoints: [
        L.latLng(this.userLocation.lat, this.userLocation.lng),
        L.latLng(selected.lat, selected.lng),
      ],
      lineOptions: {
        styles: [
          {
            color: 'blue',
            weight: 5,
            dashArray: '6, 8',
          },
        ],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      createMarker: () => null,
      position: 'bottomleft',
    }).addTo(this.map);
  }

  userIcon = L.icon({
    iconUrl: 'assets/green-marker.png', // green pin
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
  });

  locateUser(): void {
    if (!this.map) return;

    this.isLoading = true;

    this.map.locate({ setView: true, maxZoom: 19 });

    this.map.once('locationfound', (e: L.LocationEvent) => {
      this.isLoading = false;

      // Remove previous user marker
      if (this.userLocationMarker) {
        this.map.removeLayer(this.userLocationMarker);
      }

      // OPTIONAL: remove circle if used before
      if (this.userLocationCircle) {
        this.map.removeLayer(this.userLocationCircle);
      }

      // Add green user marker
      this.userLocation = e.latlng;
      this.userLocationMarker = L.marker(e.latlng, { icon: this.userIcon })
        .addTo(this.map!)
        .bindPopup('📍 You are here now')
        .openPopup();
    });

    this.map.once('locationerror', () => {
      this.isLoading = false;
      alert('❌ Unable to access your location');
    });
  }
}
