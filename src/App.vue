<template>
  <div class="container py-4">
    <!-- Cabeçalho: título + botão que abre o modal de configuração de etapas -->
    <div class="d-flex align-items-center mb-4">
      <h1 class="h3 mb-0">
        <i class="fa-solid fa-list-check me-2"></i>
        To do List
      </h1>
      <!-- Botão liga na função openStagesModal() (Bootstrap Modal) -->
      <button class="btn btn-outline-primary ms-auto" @click="openStagesModal">
        <i class="fa-solid fa-pen-to-square me-2"></i>
        Configurar etapas
      </button>
    </div>

    <!-- Barra de ações: filtro por etapa + contador total -->
    <div class="row g-2 align-items-center mb-3">
      <div class="col-12 col-md-7">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-filter"></i></span>
          <!-- v-model liga o select à reatividade (stageFilter) -->
          <select v-model="stageFilter" class="form-select">
            <option value="">Todas as etapas</option>
            <!-- Opções geradas a partir de stages (colunas atuais) -->
            <option v-for="s in stages" :key="s.key" :value="s.key">
              {{ s.label }}
            </option>
          </select>
          <!-- Zera o filtro -->
          <button class="btn btn-outline-secondary" @click="stageFilter = ''">Limpar</button>
        </div>
      </div>
      <div class="col-12 col-md-5 text-md-end">
        <!-- Contador total de tarefas -->
        <span class="badge text-bg-primary">Total: {{ tasks.length }}</span>
      </div>
    </div>

    <!-- Formulário de criação de tarefa: sempre nasce na etapa 'Início' -->
    <form class="row g-2 align-items-center mb-4" @submit.prevent="addTask">
      <div class="col-12 col-md-9">
        <!-- Campo controlado por v-model (newTaskTitle) -->
        <input
          v-model="newTaskTitle"
          type="text"
          class="form-control form-control-lg"
          placeholder="Descreva a tarefa"
          required
        />
      </div>
      <div class="col-12 col-md-3 d-grid">
        <!-- Submit chama addTask() -->
        <button type="submit" class="btn btn-primary btn-lg">
          <i class="fa-solid fa-plus me-2"></i> Adicionar
        </button>
      </div>
    </form>

    <!-- GRID das colunas (Kanban): renderiza cada etapa/coluna -->
    <div class="row g-3">
      <!-- stagesToRender já aplica filtro se houver -->
      <div
        v-for="stage in stagesToRender"
        :key="stage.key"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card h-100 shadow-sm">
          <!-- Cabeçalho de cada coluna: ícone + nome + contador local -->
          <div class="card-header d-flex align-items-center">
            <i :class="stage.icon" class="me-2"></i>
            <strong class="me-auto">{{ stage.label }}</strong>
            <span class="badge text-bg-secondary">{{ tasksByStage(stage.key).length }}</span>
          </div>

          <!-- Corpo da coluna: aceita drop (drag & drop HTML5) -->
          <div class="card-body"
               @dragover.prevent
               @drop="onDrop($event, stage.key)">
            <ul class="list-unstyled mb-0">
              <!-- Lista de tarefas da etapa -->
              <li v-for="t in tasksByStage(stage.key)" :key="t.id" class="mb-2">
  <div class="d-flex align-items-center p-2 border rounded"
       draggable="true"
       @dragstart="onDragStart($event, t.id)">
       <span class="flex-grow-1">{{ t.title }}</span>

    <!-- BOTÃO NOVO: Concluir tarefa -->
    <button v-if="t.stage !== 'fim'"
        class="btn btn-sm btn-success me-1"
        @click="completeTask(t.id)"
        title="Marcar como concluída">
  <i class="fa-solid fa-check"></i>
</button>

    <!-- Botão de excluir continua igual -->
    <button class="btn btn-sm btn-outline-danger"
            @click="removeTask(t.id)"
            title="Excluir">
      <i class="fa-solid fa-trash"></i>
    </button>
  </div>
</li>

            </ul>

            <!-- Mensagem quando a coluna está vazia -->
            <p v-if="tasksByStage(stage.key).length === 0" class="text-muted mb-0">
              Solte tarefas aqui.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL (Bootstrap): Configurar Etapas -->
    <!-- Usa ref + Bootstrap Modal JS para abrir/fechar programaticamente -->
    <div
      class="modal fade"
      tabindex="-1"
      ref="stagesModalRef"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <!-- Cabeçalho do modal -->
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa-solid fa-gear me-2"></i>Configurar Etapas
            </h5>
            <button type="button" class="btn-close" @click="closeStagesModal"></button>
          </div>

          <!-- Corpo do modal: adiciona/edita etapas intermediárias -->
          <div class="modal-body">
            <p class="mb-2">
              Add texto aqui
            </p>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>Etapas da tarefa</strong>
              <button class="btn btn-sm btn-success" @click="addStageInput">
                <i class="fa-solid fa-plus me-1"></i>Adicionar etapa
              </button>
            </div>

            <!-- stageInputs representa apenas as etapas intermediárias -->
            <div class="vstack gap-2">
              <div v-for="(s, i) in stageInputs" :key="i" class="input-group">
                <span class="input-group-text">Etapa {{ i + 1 }}</span>
                <input v-model="s.label" type="text" class="form-control" placeholder="Ex.: Tarefa 01" />
                <button class="btn btn-outline-danger" @click="removeStageInput(i)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <hr>
            <!-- Prévia visual das colunas finais (Início + intermediárias + Fim) -->
            <div>
              <div class="mb-1"><strong>Prévia das colunas:</strong></div>
              <div class="d-flex flex-wrap gap-2">
                <span class="badge text-bg-success"><i class="fa-solid fa-play me-1"></i>Início</span>
                <span v-for="(s, i) in stageInputs" :key="'p'+i" class="badge text-bg-secondary">
                  <i class="fa-solid fa-user me-1"></i>{{ s.label || '...' }}
                </span>
                <span class="badge text-bg-danger"><i class="fa-solid fa-flag-checkered me-1"></i>Fim</span>
              </div>
            </div>
          </div>

          <!-- Rodapé do modal: salva (persiste) e fecha -->
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeStagesModal">Cancelar</button>
            <button class="btn btn-primary" @click="saveStages">
              <i class="fa-solid fa-floppy-disk me-1"></i>Salvar etapas
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- /MODAL -->
  </div>
</template>

<script setup>
/*
  <script setup> (Vue 3):
  - Importa reatividade (ref, computed), ciclo de vida (onMounted), watchers e nextTick.
  - Importa o Modal do Bootstrap para controlar o diálogo via JS.
*/
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Modal } from 'bootstrap'

/* ===== Chaves do localStorage (persistência no navegador) ===== */
const LS_TASKS = 'kanban_tasks_v1'   // armazena lista de tarefas
const LS_STAGES = 'kanban_stages_v1' // armazena inputs de etapas (as intermediárias)

/* ===== Estado reativo ===== */
const stages      = ref([])   // colunas finais (Início + intermediárias + Fim)
const stageInputs = ref([])   // só as etapas intermediárias editáveis no modal
const tasks = ref([])         // lista de tarefas {id, title, stage}

const newTaskTitle = ref('')  // texto do input de nova tarefa
const stageFilter  = ref('')  // filtro por etapa (key)

/* ===== Utilitário: gera "slug" (chave) a partir do label ===== */
const slugify = (txt) =>
  txt.toString()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
     .toLowerCase()
     .replace(/[^a-z0-9]+/g, '-')  // troca espaços e símbolos por hífen
     .replace(/(^-|-$)/g, '')      // remove hífens das pontas

/* Monta o array completo de colunas a partir dos inputs intermediários */
function buildStagesFromInputs() {
  const base = [{ key: 'inicio', label: 'Tarefas Pendentes', icon: 'fa-solid fa-play' }]
  const mids = stageInputs.value
    .map(s => (s.label || '').trim())
    .filter(Boolean)
    .map(label => ({ key: slugify(label), label, icon: 'fa-solid fa-user' }))
  const end  = [{ key: 'fim', label: 'Tarefas concluídas', icon: 'fa-solid fa-flag-checkered' }]
  return [...base, ...mids, ...end]
}

/* Helpers para posicionamento de etapas e filtragem de tarefas */
function stageIndex(key) {
  return stages.value.findIndex(s => s.key === key)
}
function isFirstStage(key) {
  return stageIndex(key) === 0
}
function isLastStage(key) {
  return stageIndex(key) === stages.value.length - 1
}
function tasksByStage(key) {
  return tasks.value.filter(t => t.stage === key)
}

/* Computed que aplica o filtro de etapa (para renderização condicional das colunas) */
const stagesToRender = computed(() => {
  return stageFilter.value
    ? stages.value.filter(s => s.key === stageFilter.value)
    : stages.value
})

/* ===== Ações sobre tarefas ===== */
function addTask() {
  // Cria tarefa na etapa 'inicio' com id simples (timestamp mod 100000)
  const title = newTaskTitle.value.trim()
  if (!title) return
  const id = Date.now() % 100000
  tasks.value.push({ id, title, stage: 'inicio' })
  newTaskTitle.value = ''
}
function moveLeft(t) {
  // Move a tarefa para a etapa anterior, se existir
  const i = stageIndex(t.stage)
  if (i > 0) t.stage = stages.value[i - 1].key
}
function moveRight(t) {
  // Move a tarefa para a etapa seguinte, se existir
  const i = stageIndex(t.stage)
  if (i < stages.value.length - 1) t.stage = stages.value[i + 1].key
}
function removeTask(id) {
  // Remove a tarefa pelo id
  tasks.value = tasks.value.filter(t => t.id !== id)
}

/* ===== Drag & Drop nativo (HTML5) ===== */
function onDragStart(ev, taskId) {
  // Coloca o id da tarefa no DataTransfer para ler no drop
  ev.dataTransfer?.setData('text/plain', String(taskId))
}
function onDrop(ev, targetStageKey) {
  // Recupera o id e muda a tarefa de coluna
  const raw = ev.dataTransfer?.getData('text/plain')
  if (!raw) return
  const id = Number(raw)
  const t = tasks.value.find(x => x.id === id)
  if (t) t.stage = targetStageKey
}

/* ===== Controle do Modal do Bootstrap via JS ===== */
const stagesModalRef = ref(null) // ref do elemento <div class="modal">
let stagesModal = null           // instância do Bootstrap Modal

function ensureModalInstance() {
  // Garante uma instância única, evitando "aparece e some"
  stagesModal = Modal.getOrCreateInstance(stagesModalRef.value, {
    backdrop: 'static',
    keyboard: false
  })
}

async function openStagesModal() {
  // Aguarda o DOM atualizar, pega/gera instância e abre
  await nextTick()
  ensureModalInstance()
  stagesModal.show()
}
function closeStagesModal() {
  ensureModalInstance()
  stagesModal.hide()
}

/* CRUD dos inputs de etapas (apenas intermediárias) */
function addStageInput() {
  stageInputs.value.push({ label: '' })
}
function removeStageInput(i) {
  stageInputs.value.splice(i, 1)
}
function saveStages() {
  // Reconstrói as colunas finais e persiste apenas os inputs intermediários
  stages.value = buildStagesFromInputs()
  localStorage.setItem(LS_STAGES, JSON.stringify(stageInputs.value))
  closeStagesModal()
}

/* ===== Ciclo de vida: carrega e inicializa ===== */
onMounted(async () => {
  // 1) Carrega etapas intermediárias salvas (se houver)
  try {
    const savedInputs = JSON.parse(localStorage.getItem(LS_STAGES) || 'null')
    if (Array.isArray(savedInputs)) stageInputs.value = savedInputs
  } catch {}

  // 2) Monta colunas finais (Início + intermediárias + Fim)
  stages.value = buildStagesFromInputs()

  // 3) Primeira vez? Abre modal e sugere 2 entradas
  if (stageInputs.value.length === 0) {
    addStageInput()
    addStageInput()
    await openStagesModal()
  }

  // 4) Carrega tarefas salvas (se houver)
  try {
    const savedTasks = JSON.parse(localStorage.getItem(LS_TASKS) || 'null')
    if (Array.isArray(savedTasks)) tasks.value = savedTasks
  } catch {}
})

/* ===== Watchers: reagem a mudanças e persistem ===== */
// Sempre que editar as etapas intermediárias, reconstrói 'stages' e persiste
watch(stageInputs, async () => {
  stages.value = buildStagesFromInputs()
  localStorage.setItem(LS_STAGES, JSON.stringify(stageInputs.value))
  await nextTick()
  ensureModalInstance() // garante que o modal continue consistente após mudanças
}, { deep: true })


function completeTask(id) {
  const t = tasks.value.find(x => x.id === id)
  if (t) t.stage = 'fim'
}


// Sempre que a lista de tarefas mudar, salva no localStorage
watch(tasks, (val) => {
  localStorage.setItem(LS_TASKS, JSON.stringify(val))
}, { deep: true })
</script>
