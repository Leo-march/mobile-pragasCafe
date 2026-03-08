import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { DataService, Campo } from '../services/data.service';

@Component({
  selector: 'app-campos',
  templateUrl: './campos.page.html',
  styleUrls: ['./campos.page.scss'],
  standalone: false
})
export class CamposPage implements OnInit {
  campos: Campo[] = [];

  constructor(
    private dataService: DataService,
    private router: Router,
    private alertController: AlertController,
    private navController: NavController
  ) { }

  ngOnInit() {
    this.carregarCampos();
  }

  ionViewWillEnter() {
    this.carregarCampos();
  }

  carregarCampos() {
    this.campos = this.dataService.getCampos();
  }

  async novoCampo() {
    const aviso = await this.alertController.create({
      header: 'Criação desativada',
      message: 'A criação de talhões foi desativada. Contate o administrador para adicionar novos talhões.',
      cssClass: 'custom-alert-modal',
      buttons: [ { text: 'OK', cssClass: 'alert-button-confirm' } ]
    });
    await aviso.present();
  }

  async editarCampo(campo: Campo) {
    const alert = await this.alertController.create({
      header: 'Editar Talhão',
      cssClass: 'custom-alert-modal',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome do talhão',
          value: campo.nome,
          attributes: {
            maxlength: 50
          }
        },
        {
          name: 'localizacao',
          type: 'text',
          placeholder: 'Localização',
          value: campo.localizacao || '',
          attributes: {
            maxlength: 100
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Salvar',
          cssClass: 'alert-button-confirm',
          handler: (data) => {
            if (data.nome && data.nome.trim()) {
              this.dataService.atualizarCampo(campo.id, {
                nome: data.nome.trim(),
                localizacao: data.localizacao?.trim()
              });
              this.carregarCampos();
              return true;
            }
            return false;
          }
        }
      ]
    });

    await alert.present();
    
    setTimeout(() => {
      const firstInput = document.querySelector('ion-alert input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
  }

  async deletarCampo(campo: Campo) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente deletar o talhão "${campo.nome}"? Todas as armadilhas serão perdidas.`,
      cssClass: 'custom-alert-modal',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Deletar',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.dataService.deletarCampo(campo.id);
            this.carregarCampos();
          }
        }
      ]
    });

    await alert.present();
  }

  abrirCampo(campo: Campo) {
    this.router.navigate(['/campo-detail'], {
      queryParams: { id: campo.id }
    });
  }

  voltarParaDashboard() {
    this.navController.back();
  }

  contarFotos(campo: Campo): number {
    return campo.armadilhas.filter(a => a.foto).length;
  }

  calcularProgresso(campo: Campo): number {
    if (campo.armadilhas.length === 0) return 0;
    return this.contarFotos(campo) / campo.armadilhas.length;
  }
}