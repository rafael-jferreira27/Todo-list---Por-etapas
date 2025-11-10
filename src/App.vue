<template>
  <div class="container py-4">
    <!-- Cabeçalho -->
    <div class="d-flex align-items-center mb-4">
      <h1 class="h3 mb-0">
        <i class="fa-solid fa-list-check me-2"></i>
        To do List
      </h1>
      <button class="btn btn-outline-primary ms-auto" @click="openStagesModal">
        <i class="fa-solid fa-pen-to-square me-2"></i>
        Configurar etapas
      </button>
    </div>

    <!-- Ações: filtro de etapa + seleção de projeto -->
    <div class="row g-2 align-items-center mb-3">
      <div class="col-12 col-md-7">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-filter"></i></span>
          <select v-model="stageFilter" class="form-select">
            <option value="">Todas as etapas</option>
            <option v-for="s in stages" :key="s.key" :value="s.key">{{ s.label }}</option>
          </select>
          <button class="btn btn-outline-secondary" type="button" @click="stageFilter = ''">Limpar</button>
        </div>
      </div>

      <div class="col-12 col-md-5">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-briefcase"></i></span>
          <select v-model="activeProjectId" class="form-select">
            <option disabled value="">Selecione um projeto</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button class="btn btn-outline-secondary" type="button" @click="addProject">Novo</button>
        </div>
      </div>
    </div>

    <!-- Criar tarefa -->
    <form class="row g-2 align-items-center mb-4" @submit.prevent="addTask">
      <div class="col-12 col-md-9">
        <input
          v-model="newTaskTitle"
          :disabled="!activeProjectId"
          type="text"
          class="form-control form-control-lg"
          placeholder="Descreva a tarefa"
          required
        />
      </div>
      <div class="col-12 col-md-3 d-grid">
        <button type="submit" class="btn btn-primary btn-lg" :disabled="!activeProjectId">
          <i class="fa-solid fa-plus me-2"></i> Adicionar
        </button>
      </div>
    </form>

    <!-- Aviso se nenhum projeto estiver selecionado -->
    <div v-if="!activeProjectId" class="alert alert-info">
      Selecione ou crie um projeto para visualizar e adicionar tarefas.
    </div>

    <!-- Colunas -->
    <div v-else class="row g-3">
      <div v-for="stage in stagesToRender" :key="stage.key" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header d-flex align-items-center">
            <i :class="stage.icon" class="me-2"></i>
            <strong class="me-auto">{{ stage.label }}</strong>
            <span class="badge text-bg-secondary">{{ tasksByStage(stage.key).length }}</span>
          </div>

          <div class="card-body" @dragover.prevent @drop="onDrop($event, stage.key)">
            <ul class="list-unstyled mb-0">
              <li v-for="t in tasksByStage(stage.key)" :key="t.id" class="mb-2">
                <div
                  class="d-flex align-items-center p-2 border rounded task-row"
                  draggable="true"
                  @dragstart="onDragStart($event, t.id)"
                >
                  <span class="flex-grow-1">{{ t.title }}</span>

                  <button
                    v-if="t.stage !== 'fim'"
                    class="btn btn-sm btn-success me-1"
                    @click.stop="completeTask(t.id)"
                    title="Marcar como concluída"
                  >
                    <i class="fa-solid fa-check"></i>
                  </button>

                  <button
                    class="btn btn-sm btn-outline-secondary btn-trash"
                    @click.stop="removeTask(t.id)"
                    title="Excluir"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </li>
            </ul>

            <p v-if="tasksByStage(stage.key).length === 0" class="text-muted mb-0">
              Sem tarefas
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: configurar etapas -->
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
              <i class="fa-solid fa-gear me-2"></i>Etapas do projeto
            </h5>
            <button type="button" class="btn-close" @click="closeStagesModal" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <p class="mb-2">Personalize as etapas intermediárias.</p>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>Etapas</strong>
              <button class="btn btn-sm btn-success" @click="addStageInput">
                <i class="fa-solid fa-plus me-1"></i>Adicionar etapa
              </button>
            </div>

            <div class="vstack gap-2">
              <div v-for="(s, i) in stageInputs" :key="i" class="input-group">
                <span class="input-group-text">Etapa {{ i + 1 }}</span>
                <input v-model="s.label" type="text" class="form-control" placeholder="Ex.: Planejamento" />
                <button class="btn btn-outline-secondary btn-trash" @click="removeStageInput(i)">
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
                  <i class="fa-solid fa-layer-group"></i>{{ s.label || '...' }}
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
    <!-- /Modal -->
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { Modal } from 'bootstrap'

/* Projetos */
const projects = ref([])                       // [{ id, name }]
const activeProjectId = ref('')                // id do projeto selecionado
const tasksMap = reactive(Object.create(null)) // { [projectId]: Task[] }

function projectTasks () {
  const pid = activeProjectId.value
  if (!pid) return []
  if (!tasksMap[pid]) tasksMap[pid] = []
  return tasksMap[pid]
}

function addProject () {
  const name = (window.prompt('Nome do projeto') || '').trim()
  if (!name) return
  const id = Math.random().toString(36).slice(2, 9)
  projects.value.push({ id, name })
  if (!activeProjectId.value) activeProjectId.value = id
}

/* Etapas */
const stages      = ref([])   // [{ key, label, icon }]
const stageInputs = ref([])   // [{ label }]
const stageFilter = ref('')

const slugify = (txt) =>
  txt.toString()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .toLowerCase()
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/(^-|-$)/g, '')

function buildStagesFromInputs () {
  const base = [{ key: 'inicio', label: 'Início', icon: 'fa-solid fa-play' }]
  const mids = stageInputs.value
    .map(s => (s.label || '').trim())
    .filter(Boolean)
    .map(label => ({ key: slugify(label), label, icon: 'fa-solid fa-layer-group' }))
  const end  = [{ key: 'fim', label: 'Tarefas concluídas', icon: 'fa-solid fa-flag-checkered' }]
  return [...base, ...mids, ...end]
}

const stagesToRender = computed(() => {
  return stageFilter.value
    ? stages.value.filter(s => s.key === stageFilter.value)
    : stages.value
})

/* Tarefas */
const newTaskTitle = ref('')

function addTask () {
  if (!activeProjectId.value) return
  const title = newTaskTitle.value.trim()
  if (!title) return
  projectTasks().push({ id: Math.random().toString(36).slice(2, 9), title, stage: 'inicio' })
  newTaskTitle.value = ''
}

function removeTask (id) {
  const arr = projectTasks()
  const idx = arr.findIndex(t => t.id === id)
  if (idx >= 0) arr.splice(idx, 1)
}

function completeTask (id) {
  const t = projectTasks().find(x => x.id === id)
  if (t) t.stage = 'fim'
}

function tasksByStage (key) {
  return projectTasks().filter(t => t.stage === key)
}

/* Drag & Drop */
function onDragStart (ev, taskId) {
  ev.dataTransfer?.setData('text/plain', String(taskId))
}
function onDrop (ev, targetStageKey) {
  const raw = ev.dataTransfer?.getData('text/plain')
  if (!raw) return
  const t = projectTasks().find(x => String(x.id) === raw)
  if (t) t.stage = targetStageKey
}

/* Modal (Bootstrap) */
const stagesModalRef = ref(null)
let stagesModal = null

function ensureModalInstance () {
  stagesModal = Modal.getOrCreateInstance(stagesModalRef.value, { backdrop: 'static', keyboard: false })
}
async function openStagesModal () { await nextTick(); ensureModalInstance(); stagesModal.show() }
function closeStagesModal ()     { ensureModalInstance(); stagesModal.hide() }

/* CRUD de etapas */
function addStageInput () { stageInputs.value.push({ label: '' }) }
function removeStageInput (i) { stageInputs.value.splice(i, 1) }
function saveStages () { stages.value = buildStagesFromInputs(); closeStagesModal() }

/* Inicialização */
onMounted(() => {
  stageInputs.value.push({ label: '' }, { label: '' })
  stages.value = buildStagesFromInputs()
})

watch(stageInputs, async () => {
  stages.value = buildStagesFromInputs()
  await nextTick()
  ensureModalInstance()
}, { deep: true })
</script>

<style scoped>
.task-row { background: #fff; }
.btn-trash { min-width: 2.25rem; }
.card-body { min-height: 120px; }
</style>
