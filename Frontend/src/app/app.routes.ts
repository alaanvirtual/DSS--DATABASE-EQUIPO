import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'categorizador' },
  { path: 'categorizador', title: 'Categorizador', loadComponent: () => import('./views/categorizador/categorizador').then((m) => m.Categorizador)},
  { path: '**', redirectTo: 'categorizador' }
];
