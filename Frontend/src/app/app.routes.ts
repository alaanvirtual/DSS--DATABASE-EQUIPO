import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'login', title: 'Iniciar sesión', loadComponent: () => import('./views/login/login').then((m) => m.Login) },
  { path: 'inicio', title: 'Inicio', canActivate: [authGuard], loadComponent: () => import('./views/inicio/inicio').then((m) => m.Inicio) },
  { path: 'chat', title: 'Chat', canActivate: [authGuard], loadComponent: () => import('./views/chat/chat').then((m) => m.Chat) },
  { path: 'lluvia-ideas', title: 'Lluvia de ideas', canActivate: [authGuard], loadComponent: () => import('./views/lluvia-ideas/lluvia-ideas').then((m) => m.LluviaIdeas) },
  { path: 'categorizador', title: 'Categorizador', canActivate: [authGuard], loadComponent: () => import('./views/categorizador/categorizador').then((m) => m.Categorizador)},
  { path: 'comentador', title: 'Comentador', canActivate: [authGuard], loadComponent: () => import('./views/comentador/comentador').then((m) => m.Comentador) },
  { path: 'votacion', title: 'Votación', canActivate: [authGuard], loadComponent: () => import('./views/votacion/votacion').then((m) => m.Votacion) },
  { path: 'ponderacion', title: 'Ponderación', canActivate: [authGuard], loadComponent: () => import('./views/ponderacion/ponderacion').then((m) => m.Ponderacion) },
  { path: 'matriz', title: 'Matriz valuada', canActivate: [authGuard], loadComponent: () => import('./views/matriz/matriz').then((m) => m.Matriz) },
  { path: '**', redirectTo: 'inicio' }
];
