<template>
  <div class="container py-4">
    <!-- Título + Configurar Etapas -->
    <div class="d-flex align-items-center mb-4">
      <h1 class="h3 mb-0">
        <i class="fa-solid fa-list-check me-2"></i>
        Produção por Etapas
      </h1>
      <button class="btn btn-outline-primary ms-auto" @click="openStagesModal">
        <i class="fa-solid fa-pen-to-square me-2"></i>
        Configurar etapas
      </button>
    </div>

    <!-- Barra de ações -->
    <div class="row g-2 align-items-center mb-3">
      <div class="col-12 col-md-7">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-filter"></i></span>
          <select v-model="stageFilter" class="form-select">
            <option value="">Todas as etapas</option>
            <option v-for="s in stages" :key="s.key" :value="s.key">
              {{ s.label }}
            </option>
          </select>
          <button class="btn btn-outline-secondary" @click="stageFilter = ''">Limpar</button>
        </div>
      </div>
      <div class="col-12 col-md-5 text-md-end">
        <span class="badge text-bg-primary">Total: {{ tasks.length }}</span>
      </div>
    </div>

    <!-- Formulário: tarefa sempre nasce em 'Início' -->
    <form class="row g-2 align-items-center mb-4" @submit.prevent="addTask">
      <div class="col-12 col-md-9">
        <input
          v-model="newTaskTitle"
          type="text"
          class="form-control form-control-lg"
          placeholder="Descreva a tarefa... (nasce em Início)"
          required
        />
      </div>
      <div class="col-12 col-md-3 d-grid">
        <button type="submit" class="btn btn-primary btn-lg">
          <i class="fa-solid fa-plus me-2"></i> Adicionar
        </button>
      </div>
    </form>

    <!-- GRID de colunas -->
    <div class="row g-3">
      <div
        v-for="stage in stagesToRender"
        :key="stage.key"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card h-100 shadow-sm">
          <div class="card-header d-flex align-items-center">
            <i :class="stage.icon" class="me-2"></i>
            <strong class="me-auto">{{ stage.label }}</strong>
            <span class="badge text-bg-secondary">{{ tasksByStage(stage.key).length }}</span>
          </div>

          <div class="card-body"
               @dragover.prevent
               @drop="onDrop($event, stage.key)">
            <ul class="list-unstyled mb-0">
              <li v-for="t in tasksByStage(stage.key)" :key="t.id" class="mb-2">
                <div class="d-flex align-items-center p-2 border rounded"
                     draggable="true"
                     @dragstart="onDragStart($event, t.id)">
                  <span class="me-2 small text-muted">#{{ t.id }}</span>
                  <span class="flex-grow-1">{{ t.title }}</span>

                  <button class="btn btn-sm btn-outline-secondary me-1"
                          @click="moveLeft(t)"
                          :disabled="isFirstStage(t.stage)"
                          title="Mover para anterior">
                    <i class="fa-solid fa-arrow-left"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-secondary me-1"
                          @click="moveRight(t)"
                          :disabled="isLastStage(t.stage)"
                          title="Mover para próxima">
                    <i class="fa-solid fa-arrow-right"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger"
                          @click="removeTask(t.id)"
                          title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </li>
            </ul>

            <p v-if="tasksByStage(stage.key).length === 0" class="text-muted mb-0">
              Solte tarefas aqui.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Configurar Etapas -->
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
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fa-solid fa-gear me-2"></i>Configurar Etapas
            </h5>
            <button type="button" class="btn-close" @click="closeStagesModal"></button>
          </div>

          <div class="modal-body">
            <p class="mb-2">
              As etapas <strong>Início</strong> e <strong>Fim</strong> já são incluídas automaticamente.
              Adicione as etapas intermediárias (ex.: Caio, Crys, Durvaldo...).
            </p>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>Passos da Produção</strong>
              <button class="btn btn-sm btn-success" @click="addStageInput">
                <i class="fa-solid fa-plus me-1"></i>Adicionar etapa
              </button>
            </div>

            <div class="vstack gap-2">
              <div v-for="(s, i) in stageInputs" :key="i" class="input-group">
                <span class="input-group-text">Etapa {{ i + 1 }}</span>
                <input v-model="s.label" type="text" class="form-control" placeholder="Ex.: Caio" />
                <button class="btn btn-outline-danger" @click="removeStageInput(i)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <hr>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Modal } from 'bootstrap'

/* ===== Persistência ===== */
const LS_TASKS = 'kanban_tasks_v1'
const LS_STAGES = 'kanban_stages_v1'

/* ===== Estado ===== */
const stages      = ref([])   // colunas finais
const stageInputs = ref([])   // apenas etapas intermediárias
const tasks = ref([])

const newTaskTitle = ref('')
const stageFilter  = ref('')

/* ===== Utils ===== */
const slugify = (txt) =>
  txt.toString()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .toLowerCase()
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/(^-|-$)/g, '')

function buildStagesFromInputs() {
  const base = [{ key: 'inicio', label: 'Início', icon: 'fa-solid fa-play' }]
  const mids = stageInputs.value
    .map(s => (s.label || '').trim())
    .filter(Boolean)
    .map(label => ({ key: slugify(label), label, icon: 'fa-solid fa-user' }))
  const end  = [{ key: 'fim', label: 'Fim', icon: 'fa-solid fa-flag-checkered' }]
  return [...base, ...mids, ...end]
}

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

const stagesToRender = computed(() => {
  return stageFilter.value
    ? stages.value.filter(s => s.key === stageFilter.value)
    : stages.value
})

/* ===== Ações Tarefas ===== */
function addTask() {
  const title = newTaskTitle.value.trim()
  if (!title) return
  const id = Date.now() % 100000
  tasks.value.push({ id, title, stage: 'inicio' })
  newTaskTitle.value = ''
}
function moveLeft(t) {
  const i = stageIndex(t.stage)
  if (i > 0) t.stage = stages.value[i - 1].key
}
function moveRight(t) {
  const i = stageIndex(t.stage)
  if (i < stages.value.length - 1) t.stage = stages.value[i + 1].key
}
function removeTask(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

/* ===== Drag & Drop ===== */
function onDragStart(ev, taskId) {
  ev.dataTransfer?.setData('text/plain', String(taskId))
}
function onDrop(ev, targetStageKey) {
  const raw = ev.dataTransfer?.getData('text/plain')
  if (!raw) return
  const id = Number(raw)
  const t = tasks.value.find(x => x.id === id)
  if (t) t.stage = targetStageKey
}

/* ===== Modal Bootstrap ===== */
const stagesModalRef = ref(null)
let stagesModal = null

function ensureModalInstance() {
  // cria ou reaproveita a instância (evita "aparecer e sumir")
  stagesModal = Modal.getOrCreateInstance(stagesModalRef.value, {
    backdrop: 'static',
    keyboard: false
  })
}

async function openStagesModal() {
  await nextTick()           // garante DOM pronto
  ensureModalInstance()
  stagesModal.show()
}
function closeStagesModal() {
  ensureModalInstance()
  stagesModal.hide()
}

function addStageInput() {
  stageInputs.value.push({ label: '' })
}
function removeStageInput(i) {
  stageInputs.value.splice(i, 1)
}
function saveStages() {
  stages.value = buildStagesFromInputs()
  localStorage.setItem(LS_STAGES, JSON.stringify(stageInputs.value))
  closeStagesModal()
}

/* ===== Persistência ===== */
onMounted(async () => {
  // carrega inputs (intermediárias)
  try {
    const savedInputs = JSON.parse(localStorage.getItem(LS_STAGES) || 'null')
    if (Array.isArray(savedInputs)) stageInputs.value = savedInputs
  } catch {}

  stages.value = buildStagesFromInputs()

  // primeira vez? força usuário a cadastrar
  if (stageInputs.value.length === 0) {
    addStageInput()
    addStageInput()
    await openStagesModal()
  }

  // carrega tarefas
  try {
    const savedTasks = JSON.parse(localStorage.getItem(LS_TASKS) || 'null')
    if (Array.isArray(savedTasks)) tasks.value = savedTasks
  } catch {}
})

// Atualiza colunas ao editar inputs e persiste
watch(stageInputs, async () => {
  stages.value = buildStagesFromInputs()
  localStorage.setItem(LS_STAGES, JSON.stringify(stageInputs.value))
  await nextTick()
  ensureModalInstance() // se o conteúdo do modal mudou, garante instância válida
}, { deep: true })

watch(tasks, (val) => {
  localStorage.setItem(LS_TASKS, JSON.stringify(val))
}, { deep: true })
</script>
