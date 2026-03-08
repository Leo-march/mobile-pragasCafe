import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ActionSheetController, NavController } from '@ionic/angular';
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
  disponiveisIds: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private navController: NavController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.campoId = params['id'];
      await this.carregarCampo();
    });
  }

  ionViewWillEnter() { this.carregarCampo(); }

  async carregarCampo() {
    if (this.campoId) {
      this.campo = this.dataService.getCampo(this.campoId);
      if (!this.campo) { this.navController.back(); }
      // Atualiza lista de armadilhas disponíveis (filtragem do servidor)
      try {
        const disponiveis = await this.dataService.obterArmadilhasDisponiveis(this.campoId);
        this.disponiveisIds = new Set(disponiveis.map(d => d.id));
      } catch (e) {
        this.disponiveisIds = new Set();
      }
    }
  }

  // ── Regra: 1 foto por talhão por semana ───────────────────────────────────
  talhaoJaFotografadoHoje(): boolean {
    if (!this.campo) return false;
    const hoje = new Date();
    // semana atual: domingo (0) .. sábado (6)
    const startOfWeek = new Date(hoje);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(hoje.getDate() - hoje.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return this.campo.armadilhas.some(a => {
      if (!a.dataFoto) return false;
      const d = new Date(a.dataFoto);
      d.setHours(0,0,0,0);
      return d >= startOfWeek && d <= endOfWeek;
    });
  }

  pontoFotografadoHoje(): Armadilha | undefined {
    if (!this.campo) return undefined;
    const hoje = new Date();
    const startOfWeek = new Date(hoje);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(hoje.getDate() - hoje.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return this.campo.armadilhas.find(a => {
      if (!a.dataFoto) return false;
      const d = new Date(a.dataFoto);
      d.setHours(0,0,0,0);
      return d >= startOfWeek && d <= endOfWeek;
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  async novoPontoDeFoto() {
    const alert = await this.alertController.create({
      header: 'Novo Ponto de Foto',
      cssClass: 'custom-alert-modal',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome/Número do ponto', attributes: { required: true, maxlength: 50 } },
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
      const aviso = await this.alertController.create({
        header: 'Criação desativada',
        message: 'A criação de pontos de foto foi desativada. Contate o administrador para adicionar pontos.',
        cssClass: 'custom-alert-modal',
        buttons: [ { text: 'OK', cssClass: 'alert-button-confirm' } ]
      });
      await aviso.present();
  }

  async editarPontoDeFoto(ponto: Armadilha) {
    const alert = await this.alertController.create({
      header: 'Editar Ponto de Foto',
      cssClass: 'custom-alert-modal',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome/Número', value: ponto.nome, attributes: { maxlength: 50 } },
        { name: 'observacoes', type: 'textarea', placeholder: 'Observações', value: ponto.observacoes || '', attributes: { maxlength: 200 } }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Salvar',
          cssClass: 'alert-button-confirm',
          handler: (data) => {
            if (data.nome && data.nome.trim() && this.campoId) {
              this.dataService.atualizarArmadilha(this.campoId, ponto.id, {
                nome: data.nome.trim(),
                observacoes: data.observacoes?.trim()
              });
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

  async deletarPontoDeFoto(ponto: Armadilha) {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: `Deseja realmente excluir o ponto de foto "${ponto.nome}"?`,
      cssClass: 'custom-alert-modal',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Excluir',
          cssClass: 'alert-button-confirm',
          handler: () => {
            if (this.campoId) {
              this.dataService.deletarArmadilha(this.campoId, ponto.id);
              this.carregarCampo();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async tirarFoto(ponto: Armadilha) {
    // ── Regra: 1 foto por talhão por dia ────────────────────────────────
    if (this.talhaoJaFotografadoHoje()) {
      const jaFotografado = this.pontoFotografadoHoje();
      const alert = await this.alertController.create({
        header: '📸 Limite Semanal Atingido',
        message: `Este talhão já recebeu uma foto nesta semana (ponto "${jaFotografado?.nome ?? ''}"). Apenas 1 foto por talhão é permitida por semana.`,
        cssClass: 'custom-alert-modal',
        buttons: [{ text: 'Entendi', cssClass: 'alert-button-confirm' }]
      });
      await alert.present();
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    // não permite fotografar ponto que não esteja disponível no rodízio
    if (this.campo && this.campo.apiId && !this.disponiveisIds.has(ponto.id)) {
      const alert = await this.alertController.create({
        header: 'Ponto indisponível',
        message: 'Este ponto já foi usado no ciclo atual. Escolha outro ponto.',
        cssClass: 'custom-alert-modal',
        buttons: [{ text: 'OK', cssClass: 'alert-button-confirm' }]
      });
      await alert.present();
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      if (image.dataUrl && this.campoId) {
        this.dataService.adicionarFoto(this.campoId, ponto.id, image.dataUrl);
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

  async visualizarFoto(ponto: Armadilha) {
    if (!ponto.foto) return;
    const actionSheet = await this.actionSheetController.create({
      header: `Foto — ${ponto.nome}`,
      cssClass: 'custom-action-sheet',
      buttons: [
        { text: 'Tirar Nova Foto', icon: 'camera', handler: () => { this.tirarFoto(ponto); } },
        { text: 'Remover Foto', icon: 'trash', role: 'destructive', handler: () => { this.removerFoto(ponto); } },
        { text: 'Cancelar', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async removerFoto(ponto: Armadilha) {
    if (this.campoId) {
      this.dataService.atualizarArmadilha(this.campoId, ponto.id, { foto: undefined, dataFoto: undefined });
      this.carregarCampo();
    }
  }

  voltar() { this.navController.back(); }
}