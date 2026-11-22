import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  imports: [RouterOutlet, Sidebar, Navbar, ToastContainer, ConfirmDialog],
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.html',
  host: { class: 'block min-h-screen' },
})
export class AdminLayout {
  readonly year = new Date().getFullYear();
}
