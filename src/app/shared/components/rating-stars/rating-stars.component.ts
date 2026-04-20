import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-stars.component.html',
  styleUrls: ['./rating-stars.component.scss']
})
export class RatingStarsComponent {
  @Input() rating = 0;
  @Input() interactive = false;
  @Output() ratingChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5];
  hoverRating = 0;

  onStarClick(star: number): void {
    if (this.interactive) {
      this.rating = star;
      this.ratingChange.emit(star);
    }
  }

  onStarHover(star: number): void {
    if (this.interactive) {
      this.hoverRating = star;
    }
  }

  onMouseLeave(): void {
    this.hoverRating = 0;
  }

  getStarState(star: number): 'filled' | 'empty' {
    const displayRating = this.hoverRating || this.rating;
    return star <= displayRating ? 'filled' : 'empty';
  }
}