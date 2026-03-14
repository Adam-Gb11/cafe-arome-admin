import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrCodes } from './qr-codes';

describe('QrCodes', () => {
  let component: QrCodes;
  let fixture: ComponentFixture<QrCodes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrCodes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrCodes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
