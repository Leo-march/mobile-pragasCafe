// src/app/dashboard/dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  fotosFaltando = 0;
  taxaConclusao = 0;
  totalCampos = 0;
  totalArmadilhas = 0;

  constructor(
    private dataService: DataService,
    private router: Router,
    private alertController: AlertController,
    private navController: NavController
  ) {
    console.log('📊 DashboardPage: Construtor chamado');
  }

  async iniciarVistoriaRapida() {
    const campos = this.dataService.getCampos();
    if (!campos || campos.length === 0) {
      const alert = await this.alertController.create({
        header: 'Sem Talhões',
        message: 'Nenhum talhão cadastrado para iniciar a vistoria.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const inputs: any[] = campos.map(c => ({
      name: String(c.id),
      type: 'radio',
      label: c.nome,
      value: String(c.id)
    }));

    const alert = await this.alertController.create({
      header: 'Selecionar Talhão',
      inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Iniciar',
          handler: (value) => {
            if (!value) return false;
            // navegar para a página de detalhe e instruir para iniciar a vistoria
            this.router.navigate(['/campo-detail'], { queryParams: { id: value, start: '1' } });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  ngOnInit() {
    console.log('📊 DashboardPage: ngOnInit chamado');
    this.carregarEstatisticas();
  }

  ionViewWillEnter() {
    console.log('📊 DashboardPage: ionViewWillEnter chamado');
    this.carregarEstatisticas();
  }

  carregarEstatisticas() {
    console.log('📊 Carregando estatísticas...');
    this.fotosFaltando = this.dataService.contarFotosFaltando();
    this.taxaConclusao = this.dataService.calcularTaxaConclusao();
    
    const campos = this.dataService.getCampos();
    this.totalCampos = campos.length;
    this.totalArmadilhas = campos.reduce((total, campo) => 
      total + campo.armadilhas.length, 0
    );
    
    console.log('📊 Estatísticas carregadas:', {
      fotosFaltando: this.fotosFaltando,
      taxaConclusao: this.taxaConclusao,
      totalCampos: this.totalCampos,
      totalArmadilhas: this.totalArmadilhas
    });
  }

  navegarParaCampos() {
    console.log('🔄 Navegando para /campos...');
    this.router.navigate(['/campos']);
  }

  async mostrarDetalhesFotosFaltando() {
    const campos = this.dataService.getCampos();
    const detalhes: { nome: string; faltando: number }[] = [];
    
    campos.forEach(campo => {
      const fotosFaltando = campo.armadilhas.filter(a => !a.foto).length;
      if (fotosFaltando > 0) {
        detalhes.push({
          nome: campo.nome,
          faltando: fotosFaltando
        });
      }
    });

    if (detalhes.length === 0) {
      const alert = await this.alertController.create({
        header: '✅ Parabéns!',
        message: 'Todas as armadilhas já possuem fotos registradas!',
        cssClass: 'custom-alert-modal',
        buttons: [
          {
            text: 'OK',
            cssClass: 'alert-button-confirm'
          }
        ]
      });
      await alert.present();
      return;
    }

    let mensagem = `Total: ${this.fotosFaltando} ${this.fotosFaltando === 1 ? 'talhão sem foto' : 'talhões sem foto'}\n\n`;
    
    detalhes.forEach((item) => {
      const texto = item.faltando === 1 ? 'foto' : 'fotos';
      mensagem += `📍 ${item.nome}\n   ${item.faltando} ${texto} sem foto\n\n`;
    });

    const alert = await this.alertController.create({
      header: '📸 Talhões sem foto',
      message: mensagem,
      cssClass: 'custom-alert-modal fotos-faltando-alert',
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Ver Talhões',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.navegarParaCampos();
          }
        }
      ]
    });

    await alert.present();
  }

  async adicionarNovoTalhao() {
    const aviso = await this.alertController.create({
      header: 'Criação desativada',
      message: 'A criação de talhões foi desativada. Contate o administrador para adicionar novos talhões.',
      cssClass: 'custom-alert-modal',
      buttons: [ { text: 'OK', cssClass: 'alert-button-confirm' } ]
    });
    await aviso.present();
  }
}