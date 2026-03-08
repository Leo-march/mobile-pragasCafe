import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Campo, Armadilha, DataService } from '../services/data.service';

interface ResumoItem {
  armadilha: Armadilha;
  fotografada: boolean;
  foto?: string;
}

@Component({
  selector: 'app-vistoria-modal',
  templateUrl: './vistoria-modal.component.html',
  styleUrls: ['./vistoria-modal.component.scss'],
})
export class VistoriaModalComponent implements OnInit {
  @Input() campo!: Campo;
  
  armadilhas: Armadilha[] = [];
  indiceAtual = 0;
  armadilhaAtual?: Armadilha;
  fotoAtual?: string;
  
  vistoriaFinalizada = false;
  resumoVistoria: ResumoItem[] = [];
  
  fotosTiradas = 0;
  fotosNaoTiradas = 0;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.loadArmadilhasDisponiveis();
  }

  private async loadArmadilhasDisponiveis() {
    try {
      const disponiveis = await this.dataService.obterArmadilhasDisponiveis(this.campo.id);
      this.armadilhas = [...disponiveis];
      if (this.armadilhas.length > 0) this.armadilhaAtual = this.armadilhas[0];
    } catch (err) {
      console.warn('Erro carregando armadilhas disponíveis, usando todas locais', err);
      this.armadilhas = [...this.campo.armadilhas];
      if (this.armadilhas.length > 0) this.armadilhaAtual = this.armadilhas[0];
    }
  }

  get progresso(): number {
    if (this.armadilhas.length === 0) return 0;
    return ((this.indiceAtual + 1) / this.armadilhas.length) * 100;
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        this.fotoAtual = image.dataUrl;
        
        // Salvar foto automaticamente
        if (this.armadilhaAtual) {
          this.dataService.adicionarFoto(
            this.campo.id,
            this.armadilhaAtual.id,
            image.dataUrl
          );
        }
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Não foi possível acessar a câmera.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  proximaArmadilha() {
    if (!this.armadilhaAtual) return;

    // Adicionar ao resumo
    this.resumoVistoria.push({
      armadilha: this.armadilhaAtual,
      fotografada: true,
      foto: this.fotoAtual
    });

    this.fotosTiradas++;
    this.avancar();
  }

  pularArmadilha() {
    if (!this.armadilhaAtual) return;

    // Adicionar ao resumo como não fotografada
    this.resumoVistoria.push({
      armadilha: this.armadilhaAtual,
      fotografada: false
    });

    this.fotosNaoTiradas++;
    this.avancar();
  }

  private avancar() {
    this.fotoAtual = undefined;
    this.indiceAtual++;

    if (this.indiceAtual >= this.armadilhas.length) {
      // Finalizar vistoria
      this.vistoriaFinalizada = true;
    } else {
      // Próxima armadilha
      this.armadilhaAtual = this.armadilhas[this.indiceAtual];
    }
  }

  refazerVistoria() {
    // Resetar tudo
    this.indiceAtual = 0;
    this.fotoAtual = undefined;
    this.vistoriaFinalizada = false;
    this.resumoVistoria = [];
    this.fotosTiradas = 0;
    this.fotosNaoTiradas = 0;
    this.armadilhaAtual = this.armadilhas[0];
  }

  finalizarVistoria() {
    this.modalController.dismiss({
      concluida: true,
      fotosTiradas: this.fotosTiradas,
      fotosNaoTiradas: this.fotosNaoTiradas
    });
  }

  async fecharVistoria() {
    if (this.resumoVistoria.length > 0 && !this.vistoriaFinalizada) {
      const alert = await this.alertController.create({
        header: 'Confirmar Saída',
        message: 'Você já fotografou algumas armadilhas. Deseja realmente sair?',
        buttons: [
          {
            text: 'Continuar Vistoria',
            role: 'cancel'
          },
          {
            text: 'Sair',
            role: 'destructive',
            handler: () => {
              this.modalController.dismiss();
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.modalController.dismiss();
    }
  }
}