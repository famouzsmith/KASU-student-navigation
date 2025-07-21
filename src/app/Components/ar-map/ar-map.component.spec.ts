import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArMapComponent } from './ar-map.component';

describe('ArMapComponent', () => {
  let component: ArMapComponent;
  let fixture: ComponentFixture<ArMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
