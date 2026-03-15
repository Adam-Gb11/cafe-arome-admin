import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class ReviewsComponent implements OnInit {
  private api = inject(ApiService);

  reviews = signal<any[]>([]);
  stats   = signal<any>(null);
  loading = signal(true);
  Math = Math;

  get stars() {
    return [1, 2, 3, 4, 5];
  }

  ngOnInit() {
    this.api.getReviewStats().subscribe(stats => {
      this.stats.set(stats);
    });
    this.api.getReviews().subscribe(reviews => {
      this.reviews.set(reviews);
      this.loading.set(false);
    });
  }

  getStarCount(rating: number): number {
    return this.stats()?.dist?.find((d: any) => d.rating === rating)?.count ?? 0;
  }

  getStarPercent(rating: number): number {
    const total = this.stats()?.total ?? 0;
    return total ? (this.getStarCount(rating) / total) * 100 : 0;
  }

  renderStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}