import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CafePlan } from './cafe-plan';

describe('CafePlan', () => {
  let component: CafePlan;
  let fixture: ComponentFixture<CafePlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CafePlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CafePlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
