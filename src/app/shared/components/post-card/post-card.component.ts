import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../core/models/post.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: Post;
  @Output() edit = new EventEmitter<Post>();
  @Output() delete = new EventEmitter<Post>();

  constructor(private authService: AuthService) {}

  get canEdit(): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;
    
    return currentUser.id === this.post.user_id || currentUser.role === 'admin';
  }

  getUserInitial(): string {
    const username = this.post.user?.username || this.post.user?.email || 'A';
    return username.charAt(0).toUpperCase();
  }

  getFormattedDate(): string {
    const date = new Date(this.post.created_at);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  onEdit(): void {
    this.edit.emit(this.post);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete "${this.post.title}"?`)) {
      this.delete.emit(this.post);
    }
  }
}