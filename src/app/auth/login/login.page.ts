import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavController, AlertController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  email = '';
  senha = '';
  mostrarSenha = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private navController: NavController
    , private tokenService: TokenService
  ) {
    console.log('🔵 LoginPage: Construtor chamado');
  }

  ngOnInit() {
    console.log('🔵 LoginPage: ngOnInit chamado');
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  fazerLogin() {
    this._doLogin();
  }

  private async _doLogin() {
    if (!this.email || !this.senha) {
      return this.showAlert('Campos inválidos', 'Preencha email e senha.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return this.showAlert('Email inválido', 'Digite um email válido.');
    }

    try {
      const url = `${environment.apiUrl}/usuarios/login`;
      const resp: any = await this.http.post(url, { email: this.email, senha: this.senha }).toPromise();
      if (resp && resp.token) {
        await this.tokenService.clearAll();
        await this.tokenService.setToken(resp.token);
        await this.showAlert('Bem-vindo', 'Login realizado com sucesso.');
        this.router.navigate(['/dashboard']);
      } else {
        this.showAlert('Erro', 'Resposta inesperada do servidor.');
      }
    } catch (err: any) {
      console.error('Erro login:', err);
      const msg = err?.error?.erro || err?.message || 'Erro ao efetuar login';
      this.showAlert('Login falhou', msg);
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  irParaCadastro() {
    console.log('🔄 Navegando para /cadastro...');
    this.router.navigate(['/cadastro']);
  }
}