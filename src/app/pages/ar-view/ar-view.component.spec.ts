import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArViewComponent } from './ar-view.component';

describe('ArViewComponent', () => {
  let component: ArViewComponent;
  let fixture: ComponentFixture<ArViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
