import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ActionSheetController, NavController, ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DataService, Campo, Armadilha } from '../services/data.service';

@Component({
  selector: 'app-campo-detail',
  templateUrl: './campo-detail.page.html',
  styleUrls: ['./campo-detail.page.scss'],
  standalone: false
})
export class CampoDetailPage implements OnInit {
  campo?: Campo;
  campoId?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private navController: NavController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.campoId = params['id'];
      await this.carregarCampo();
      if (params['start'] === '1') {
        setTimeout(() => { this.iniciarVistoria(); }, 200);
      }
    });
  }

  ionViewWillEnter() { this.carregarCampo(); }

  async carregarCampo() {
    if (this.campoId) {
      this.campo = this.dataService.getCampo(this.campoId);
      if (!this.campo) { this.navController.back(); }
    }
  }

  async iniciarVistoria() {
    if (!this.campo || this.campo.armadilhas.length === 0) {
      const alert = await this.alertController.create({
        header: 'Aviso',
        message: 'Não há armadilhas cadastradas para realizar a vistoria.',
        cssClass: 'custom-alert-modal',
        buttons: [{ text: 'OK', cssClass: 'alert-button-confirm' }]
      });
      await alert.present();
      return;
    }

    const modal = await this.modalController.create({
      component: VistoriaModalComponent,
      componentProps: {
        campo: this.campo,
        dataService: this.dataService
      },
      cssClass: 'vistoria-modal'
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.concluida) {
      this.carregarCampo();
      const alert = await this.alertController.create({
        header: '✅ Vistoria Concluída!',
        message: `${data.fotosTiradas} foto(s) registrada(s)\n${data.fotosNaoTiradas} armadilha(s) pulada(s)`,
        cssClass: 'custom-alert-modal',
        buttons: [{ text: 'OK', cssClass: 'alert-button-confirm' }]
      });
      await alert.present();
    }
  }

  async novaArmadilha() {
    const alert = await this.alertController.create({
      header: 'Nova Armadilha',
      cssClass: 'custom-alert-modal',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome/Número da armadilha', attributes: { required: true, maxlength: 50 } },
        { name: 'observacoes', type: 'textarea', placeholder: 'Observações (opcional)', attributes: { maxlength: 200 } }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Criar',
          cssClass: 'alert-button-confirm',
          handler: (data) => {
            if (data.nome && data.nome.trim() && this.campoId) {
              this.dataService.adicionarArmadilha(this.campoId, data.nome.trim(), data.observacoes?.trim());
              this.carregarCampo();
              return true;
            }
            return false;
          }
        }
      ]
    });
    await alert.present();
    setTimeout(() => { const i = document.querySelector('ion-alert input') as HTMLInputElement; if (i) i.focus(); }, 300);
  }

  async editarArmadilha(armadilha: Armadilha) {
    const alert = await this.alertController.create({
      header: 'Editar Armadilha',
      cssClass: 'custom-alert-modal',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome/Número', value: armadilha.nome, attributes: { maxlength: 50 } },
        { name: 'observacoes', type: 'textarea', placeholder: 'Observações', value: armadilha.observacoes || '', attributes: { maxlength: 200 } }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Salvar',
          cssClass: 'alert-button-confirm',
          handler: (data) => {
            if (data.nome && data.nome.trim() && this.campoId) {
              this.dataService.atualizarArmadilha(this.campoId, armadilha.id, { nome: data.nome.trim(), observacoes: data.observacoes?.trim() });
              this.carregarCampo();
              return true;
            }
            return false;
          }
        }
      ]
    });
    await alert.present();
    setTimeout(() => { const i = document.querySelector('ion-alert input') as HTMLInputElement; if (i) i.focus(); }, 300);
  }

  async deletarArmadilha(armadilha: Armadilha) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente deletar a armadilha "${armadilha.nome}"?`,
      cssClass: 'custom-alert-modal',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Deletar',
          cssClass: 'alert-button-confirm',
          handler: () => { if (this.campoId) { this.dataService.deletarArmadilha(this.campoId, armadilha.id); this.carregarCampo(); } }
        }
      ]
    });
    await alert.present();
  }

  async tirarFoto(armadilha: Armadilha) {
    try {
      const image = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      if (image.dataUrl && this.campoId) {
        this.dataService.adicionarFoto(this.campoId, armadilha.id, image.dataUrl);
        this.carregarCampo();
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Não foi possível acessar a câmera. Verifique as permissões.',
        cssClass: 'custom-alert-modal',
        buttons: [{ text: 'OK', cssClass: 'alert-button-confirm' }]
      });
      await alert.present();
    }
  }

  async visualizarFoto(armadilha: Armadilha) {
    if (!armadilha.foto) return;
    const actionSheet = await this.actionSheetController.create({
      header: `Foto - ${armadilha.nome}`,
      cssClass: 'custom-action-sheet',
      buttons: [
        { text: 'Tirar Nova Foto', icon: 'camera', handler: () => { this.tirarFoto(armadilha); } },
        { text: 'Remover Foto', icon: 'trash', role: 'destructive', handler: () => { this.removerFoto(armadilha); } },
        { text: 'Cancelar', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async removerFoto(armadilha: Armadilha) {
    if (this.campoId) {
      this.dataService.atualizarArmadilha(this.campoId, armadilha.id, { foto: undefined, dataFoto: undefined });
      this.carregarCampo();
    }
  }

  voltar() { this.navController.back(); }
}

// Componente do Modal de Vistoria — tema Café
@Component({
  selector: 'app-vistoria-modal',
  template: `
<ion-header>
  <ion-toolbar color="dark">
    <ion-buttons slot="start">
      <ion-button (click)="fecharVistoria()">
        <ion-icon name="close"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>Vistoria Rápida</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="vistoria-content">
  <div class="progress-section">
    <div class="progress-info">
      <h3>{{ campo.nome }}</h3>
      <p>{{ indiceAtual + 1 }} de {{ armadilhas.length }} armadilhas</p>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" [style.width]="progresso + '%'"></div>
    </div>
  </div>

  @if (!vistoriaFinalizada) {
    <div class="armadilha-atual">
      <ion-card class="armadilha-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="flag"></ion-icon>
            {{ armadilhaAtual?.nome }}
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (fotoAtual) {
            <div class="foto-preview">
              <img [src]="fotoAtual" alt="Preview">
              <div class="foto-overlay">
                <ion-icon name="checkmark-circle"></ion-icon>
                <p>Foto capturada!</p>
              </div>
            </div>
          }
          @if (!fotoAtual) {
            <div class="sem-foto">
              <ion-icon name="camera-outline"></ion-icon>
              <p>Pronto para fotografar</p>
            </div>
          }
          @if (armadilhaAtual?.observacoes) {
            <div class="observacoes">
              <ion-icon name="information-circle"></ion-icon>
              <p>{{ armadilhaAtual?.observacoes }}</p>
            </div>
          }
          <div class="action-buttons">
            <ion-button expand="block" color="primary" size="large" (click)="tirarFoto()" [disabled]="!!fotoAtual">
              <ion-icon name="camera" slot="start"></ion-icon>
              {{ fotoAtual ? 'Foto Tirada' : 'Tirar Foto' }}
            </ion-button>
            <div class="secondary-actions">
              <ion-button expand="block" fill="outline" color="warning" (click)="pularArmadilha()">
                <ion-icon name="play-skip-forward" slot="start"></ion-icon>
                Pular
              </ion-button>
              <ion-button expand="block" color="success" (click)="proximaArmadilha()" [disabled]="!fotoAtual">
                <ion-icon name="arrow-forward" slot="end"></ion-icon>
                Próxima
              </ion-button>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </div>
  }

  @if (vistoriaFinalizada) {
    <div class="resumo-final">
      <div class="resumo-header">
        <ion-icon name="checkmark-circle" color="success"></ion-icon>
        <h2>Vistoria Concluída!</h2>
        <p>Confira o resumo abaixo</p>
      </div>
      <ion-card class="stats-card">
        <ion-card-content>
          <div class="stat-item">
            <div class="stat-icon success"><ion-icon name="camera"></ion-icon></div>
            <div class="stat-info"><h3>{{ fotosTiradas }}</h3><p>Fotos Tiradas</p></div>
          </div>
          <div class="stat-item">
            <div class="stat-icon warning"><ion-icon name="alert-circle"></ion-icon></div>
            <div class="stat-info"><h3>{{ fotosNaoTiradas }}</h3><p>Não Fotografadas</p></div>
          </div>
        </ion-card-content>
      </ion-card>
      <div class="lista-resumo">
        <h3>Detalhes da Vistoria</h3>
        <ion-list>
          @for (item of resumoVistoria; track item) {
            <ion-item [class.fotografada]="item.fotografada">
              <ion-icon [name]="item.fotografada ? 'checkmark-circle' : 'close-circle'" [color]="item.fotografada ? 'success' : 'danger'" slot="start"></ion-icon>
              <ion-label>
                <h2>{{ item.armadilha.nome }}</h2>
                @if (item.armadilha.observacoes) { <p>{{ item.armadilha.observacoes }}</p> }
              </ion-label>
              <ion-badge [color]="item.fotografada ? 'success' : 'danger'" slot="end">
                {{ item.fotografada ? 'Fotografada' : 'Pulada' }}
              </ion-badge>
            </ion-item>
          }
        </ion-list>
      </div>
      <div class="final-actions">
        <ion-button expand="block" color="success" size="large" (click)="finalizarVistoria()">
          <ion-icon name="checkmark" slot="start"></ion-icon>
          Finalizar
        </ion-button>
        <ion-button expand="block" fill="outline" color="primary" (click)="refazerVistoria()">
          <ion-icon name="refresh" slot="start"></ion-icon>
          Refazer Vistoria
        </ion-button>
      </div>
    </div>
  }
</ion-content>
`,
  styles: [`
.vistoria-content { --background: linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%); }
.progress-section { padding: 20px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.progress-section .progress-info { text-align: center; margin-bottom: 16px; }
.progress-section .progress-info h3 { margin: 0 0 8px 0; color: #4e342e; font-size: 20px; font-weight: 700; }
.progress-section .progress-info p { margin: 0; color: #795548; font-size: 14px; font-weight: 600; }
.progress-section .progress-bar { height: 8px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
.progress-section .progress-bar .progress-fill { height: 100%; background: linear-gradient(90deg, #6d4c41 0%, #8d6e63 100%); transition: width 0.4s cubic-bezier(0.4,0,0.2,1); border-radius: 10px; }
.armadilha-atual { padding: 20px; }
.armadilha-atual .armadilha-card { margin: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-radius: 20px; overflow: hidden; }
.armadilha-atual .armadilha-card ion-card-header { background: linear-gradient(135deg, #4e342e 0%, #6d4c41 100%); padding: 20px; }
.armadilha-atual .armadilha-card ion-card-title { color: white; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 12px; }
.armadilha-atual .armadilha-card ion-card-title ion-icon { font-size: 28px; }
.armadilha-atual .armadilha-card ion-card-content { padding: 24px; }
.foto-preview { position: relative; width: 100%; height: 300px; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
.foto-preview img { width: 100%; height: 100%; object-fit: cover; }
.foto-preview .foto-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(78,52,46,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
.foto-preview .foto-overlay ion-icon { font-size: 64px; color: white; margin-bottom: 12px; }
.foto-preview .foto-overlay p { color: white; font-size: 18px; font-weight: 600; margin: 0; }
.sem-foto { height: 300px; background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%); border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px; border: 3px dashed #d7ccc8; }
.sem-foto ion-icon { font-size: 80px; color: #6d4c41; opacity: 0.5; margin-bottom: 16px; }
.sem-foto p { color: #999; font-size: 16px; font-weight: 600; margin: 0; }
.observacoes { background: #fff8e1; padding: 16px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #ff8f00; display: flex; gap: 12px; }
.observacoes ion-icon { font-size: 24px; color: #e65100; flex-shrink: 0; }
.observacoes p { margin: 0; color: #5d4037; font-size: 14px; line-height: 1.5; }
.action-buttons ion-button { margin-bottom: 12px; height: 56px; font-weight: 600; --border-radius: 12px; }
.action-buttons .secondary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
.action-buttons .secondary-actions ion-button { margin: 0; height: 48px; }
.resumo-final { padding: 20px; }
.resumo-final .resumo-header { text-align: center; padding: 40px 20px; }
.resumo-final .resumo-header ion-icon { font-size: 80px; margin-bottom: 16px; }
.resumo-final .resumo-header h2 { margin: 0 0 8px 0; color: #4e342e; font-size: 28px; font-weight: 700; }
.resumo-final .resumo-header p { margin: 0; color: #795548; font-size: 16px; }
.resumo-final .stats-card { margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-radius: 16px; }
.resumo-final .stats-card ion-card-content { padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.resumo-final .stats-card .stat-item { display: flex; align-items: center; gap: 16px; }
.resumo-final .stats-card .stat-item .stat-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.resumo-final .stats-card .stat-item .stat-icon ion-icon { font-size: 28px; color: white; }
.resumo-final .stats-card .stat-item .stat-icon.success { background: linear-gradient(135deg, #4e342e 0%, #6d4c41 100%); }
.resumo-final .stats-card .stat-item .stat-icon.warning { background: linear-gradient(135deg, #fbc02d 0%, #fdd835 100%); }
.resumo-final .stats-card .stat-item .stat-info h3 { margin: 0 0 4px 0; font-size: 32px; font-weight: 700; color: #4e342e; }
.resumo-final .stats-card .stat-item .stat-info p { margin: 0; font-size: 13px; color: #795548; font-weight: 600; }
.resumo-final .lista-resumo { margin-bottom: 24px; }
.resumo-final .lista-resumo h3 { margin: 0 0 16px 0; color: #4e342e; font-size: 18px; font-weight: 700; padding: 0 4px; }
.resumo-final .lista-resumo ion-list { background: transparent; padding: 0; }
.resumo-final .lista-resumo ion-item { --background: white; --border-radius: 12px; --padding-start: 16px; --padding-end: 16px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.resumo-final .lista-resumo ion-item.fotografada { --background: #efebe9; }
.resumo-final .lista-resumo ion-item ion-icon { font-size: 24px; margin-right: 12px; }
.resumo-final .lista-resumo ion-item ion-label h2 { color: #4e342e; font-weight: 600; font-size: 16px; }
.resumo-final .lista-resumo ion-item ion-label p { color: #795548; font-size: 13px; margin-top: 4px; }
.resumo-final .lista-resumo ion-item ion-badge { font-size: 11px; font-weight: 600; padding: 6px 12px; }
.resumo-final .final-actions ion-button { margin-bottom: 12px; height: 52px; font-weight: 600; --border-radius: 12px; }
.resumo-final .final-actions ion-button:last-child { margin-bottom: 0; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 480px) {
  .resumo-final .stats-card ion-card-content { grid-template-columns: 1fr; }
  .foto-preview, .sem-foto { height: 250px; }
}
  `],
  standalone: false
})
export class VistoriaModalComponent implements OnInit {
  campo!: Campo;
  dataService!: DataService;

  armadilhas: Armadilha[] = [];
  indiceAtual = 0;
  armadilhaAtual?: Armadilha;
  fotoAtual?: string;

  vistoriaFinalizada = false;
  resumoVistoria: any[] = [];

  fotosTiradas = 0;
  fotosNaoTiradas = 0;

  constructor(private modalController: ModalController, private alertController: AlertController) {}

  ngOnInit() {
    this.armadilhas = [...this.campo.armadilhas];
    if (this.armadilhas.length > 0) { this.armadilhaAtual = this.armadilhas[0]; }
  }

  get progresso(): number {
    if (this.armadilhas.length === 0) return 0;
    return ((this.indiceAtual + 1) / this.armadilhas.length) * 100;
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      if (image.dataUrl) {
        this.fotoAtual = image.dataUrl;
        if (this.armadilhaAtual) { this.dataService.adicionarFoto(this.campo.id, this.armadilhaAtual.id, image.dataUrl); }
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      const alert = await this.alertController.create({ header: 'Erro', message: 'Não foi possível acessar a câmera.', buttons: ['OK'] });
      await alert.present();
    }
  }

  proximaArmadilha() {
    if (!this.armadilhaAtual) return;
    this.resumoVistoria.push({ armadilha: this.armadilhaAtual, fotografada: true, foto: this.fotoAtual });
    this.fotosTiradas++;
    if (this.indiceAtual >= this.armadilhas.length - 1) { this.vistoriaFinalizada = true; } else { this.avancar(); }
  }

  pularArmadilha() {
    if (!this.armadilhaAtual) return;
    this.resumoVistoria.push({ armadilha: this.armadilhaAtual, fotografada: false });
    this.fotosNaoTiradas++;
    if (this.indiceAtual >= this.armadilhas.length - 1) { this.vistoriaFinalizada = true; } else { this.avancar(); }
  }

  private avancar() {
    this.fotoAtual = undefined;
    this.indiceAtual++;
    this.armadilhaAtual = this.armadilhas[this.indiceAtual];
  }

  refazerVistoria() {
    this.indiceAtual = 0; this.fotoAtual = undefined; this.vistoriaFinalizada = false;
    this.resumoVistoria = []; this.fotosTiradas = 0; this.fotosNaoTiradas = 0;
    this.armadilhaAtual = this.armadilhas[0];
  }

  finalizarVistoria() {
    this.modalController.dismiss({ concluida: true, fotosTiradas: this.fotosTiradas, fotosNaoTiradas: this.fotosNaoTiradas });
  }

  async fecharVistoria() {
    if (this.resumoVistoria.length > 0 && !this.vistoriaFinalizada) {
      const alert = await this.alertController.create({
        header: 'Confirmar Saída',
        message: 'Você já fotografou algumas armadilhas. Deseja realmente sair?',
        buttons: [
          { text: 'Continuar Vistoria', role: 'cancel' },
          { text: 'Sair', role: 'destructive', handler: () => { this.modalController.dismiss(); } }
        ]
      });
      await alert.present();
    } else { this.modalController.dismiss(); }
  }
}