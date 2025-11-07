import { createApp } from 'vue'
import App from './App.vue'

// Importação do CSS do Bootstrap https://getbootstrap.com/docs/4.4/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css'

// JavaScript do Bootstrap (com Popper embutido)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Ícones Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

// Cria e mostra o app dentro do <div id="app">
createApp(App).mount('#app')
