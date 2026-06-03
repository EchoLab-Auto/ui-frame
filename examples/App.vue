<script setup lang="ts">
import { ref, computed } from 'vue'

// ---- Theme state ----
const isDark = ref(false)

// ---- Switch demos ----
const switch1 = ref(false)
const switch2 = ref(true)

// ---- Checkbox demos ----
const checkbox1 = ref(false)
const checkbox2 = ref(true)
const checkboxIndeterminate = ref(true)
const checkboxGroup = ref<string[]>([])

// ---- Radio demos ----
const radio1 = ref('a')
const radio2 = ref('medium')

// ---- Select demos ----
const select1 = ref('vue')
const select2 = ref('')

const selectOptions = [
  { label: 'Vue 3', value: 'vue' },
  { label: 'React 18', value: 'react' },
  { label: 'Angular 16', value: 'angular' },
  { label: 'Svelte 4', value: 'svelte', disabled: true },
  { label: 'Solid.js', value: 'solid' },
]

const sizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
]

// ---- Input & Textarea demos ----
const inputName = ref('')
const inputEmail = ref('')
const textareaValue = ref('')

// ---- Modal demo ----
const modalVisible = ref(false)

// ---- Tabs demo ----
const activeTab = ref('tab1')
const tabItems = [
  { key: 'tab1', label: 'Tab 1' },
  { key: 'tab2', label: 'Tab 2' },
  { key: 'tab3', label: 'Tab 3' },
  { key: 'tab4', label: 'Disabled', disabled: true },
]

// ---- Breadcrumb demo ----
const breadcrumbItems = [
  { label: 'Home', to: '#' },
  { label: 'Components', to: '#' },
  { label: 'Button' },
]

// ---- Pagination demo ----
const page = ref(1)
const page2 = ref(3)

// ---- Collapse demo ----
const collapseActive = ref<string[]>(['item1'])
const collapseItems = [
  { key: 'item1', title: 'What is Neumorphism?' },
  { key: 'item2', title: 'How to use this library?' },
  { key: 'item3', title: 'Disabled item', disabled: true },
]

// ---- Toast demo ----
const toastContainer = ref<InstanceType<typeof import('../src/components/NeumorphismToast/NeumorphismToastProvider.vue')['default']>>()
let toastCounter = 0
function showToast(type: string) {
  toastCounter++
  toastContainer.value?.addToast({
    message: `${type} notification #${toastCounter} - Neumorphism is beautiful!`,
    type: type as any,
    duration: 3000,
  })
}

// ---- Progress demo ----
const progressVal = ref(60)
const indeterminate = ref(false)

// ---- Tag demo ----
const tagVisible = ref(true)

// ---- Form demo ----
const formModel = ref({
  username: '',
  email: '',
  password: '',
})
const formRef = ref()

const formRules = {
  username: [
    { required: true, message: 'Username is required' },
    { minLength: 3, message: 'At least 3 characters' },
  ],
  email: [
    { required: true, message: 'Email is required' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 6, message: 'At least 6 characters' },
  ],
}

function handleFormSubmit(model: Record<string, unknown>) {
  showToast('success')
  console.log('Form submitted:', model)
}

// ---- Skeleton demo ----
const skeletonLoading = ref(true)
</script>

<template>
  <div class="showcase" :data-theme="isDark ? 'dark' : undefined">
    <!-- ===== HEADER ===== -->
    <header class="showcase-header">
      <h1 class="showcase-title">@echolab/ui-frame</h1>
      <p class="showcase-subtitle">Vue 3 Neumorphism UI Component Library - {{ 23 }} Components</p>
      <div class="showcase-theme-row">
        <NeumorphismSwitch v-model="isDark" size="medium" />
        <span class="showcase-theme-label">{{ isDark ? 'Dark' : 'Light' }}</span>
      </div>
    </header>

    <!-- ===== SIDEBAR NAV ===== -->
    <nav class="showcase-nav" aria-label="Component navigation">
      <a href="#buttons">Button</a>
      <a href="#switch">Switch</a>
      <a href="#checkbox">Checkbox</a>
      <a href="#radio">Radio</a>
      <a href="#input">Input</a>
      <a href="#textarea">Textarea</a>
      <a href="#select">Select</a>
      <a href="#form">Form</a>
      <a href="#card">Card</a>
      <a href="#modal">Modal</a>
      <a href="#toast">Toast</a>
      <a href="#tooltip">Tooltip</a>
      <a href="#tabs">Tabs</a>
      <a href="#breadcrumb">Breadcrumb</a>
      <a href="#pagination">Pagination</a>
      <a href="#collapse">Collapse</a>
      <a href="#avatar">Avatar</a>
      <a href="#badge">Badge</a>
      <a href="#tag">Tag</a>
      <a href="#progress">Progress</a>
      <a href="#skeleton">Skeleton</a>
      <a href="#divider">Divider</a>
    </nav>

    <!-- ======================================================= -->
    <!-- BUTTON -->
    <!-- ======================================================= -->
    <section id="buttons" class="showcase-section">
      <h2 class="section-title">NeumorphismButton</h2>
      <p class="section-desc">Soft shadow button with raised/flat/pressed variants, three sizes, and loading state.</p>

      <div class="subsection">
        <h3 class="subsection-title">Variants</h3>
        <div class="demo-row">
          <NeumorphismButton variant="raised">Raised</NeumorphismButton>
          <NeumorphismButton variant="flat">Flat</NeumorphismButton>
          <NeumorphismButton variant="pressed">Pressed</NeumorphismButton>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Sizes & Shapes</h3>
        <div class="demo-row">
          <NeumorphismButton size="small">Small</NeumorphismButton>
          <NeumorphismButton size="medium">Medium</NeumorphismButton>
          <NeumorphismButton size="large">Large</NeumorphismButton>
          <NeumorphismDivider direction="vertical" />
          <NeumorphismButton shape="rounded">Rounded</NeumorphismButton>
          <NeumorphismButton shape="pill">Pill</NeumorphismButton>
          <NeumorphismButton shape="circle" size="medium" aria-label="Add">+</NeumorphismButton>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Loading & Disabled</h3>
        <div class="demo-row">
          <NeumorphismButton loading>Loading...</NeumorphismButton>
          <NeumorphismButton disabled>Disabled</NeumorphismButton>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- SWITCH -->
    <!-- ======================================================= -->
    <section id="switch" class="showcase-section">
      <h2 class="section-title">NeumorphismSwitch</h2>
      <p class="section-desc">Toggle switch with sun/moon icons, cross-fade animation, and crisp critically-damped motion.</p>

      <div class="subsection">
        <h3 class="subsection-title">Sizes</h3>
        <div class="demo-row demo-row--vertical">
          <div class="demo-row">
            <NeumorphismSwitch v-model="switch1" size="small" />
            <code>small</code>
          </div>
          <div class="demo-row">
            <NeumorphismSwitch v-model="switch1" size="medium" />
            <code>medium</code>
          </div>
          <div class="demo-row">
            <NeumorphismSwitch v-model="switch1" size="large" />
            <code>large</code>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">With labels & disabled</h3>
        <div class="demo-row">
          <NeumorphismSwitch v-model="switch2" active-text="On" inactive-text="Off" />
          <NeumorphismSwitch :model-value="true" disabled />
          <NeumorphismSwitch :model-value="false" disabled />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- CHECKBOX -->
    <!-- ======================================================= -->
    <section id="checkbox" class="showcase-section">
      <h2 class="section-title">NeumorphismCheckbox</h2>
      <p class="section-desc">Checkbox with inset box style, check mark SVG, indeterminate state, and three sizes.</p>

      <div class="subsection">
        <h3 class="subsection-title">Basic & Indeterminate</h3>
        <div class="demo-row">
          <NeumorphismCheckbox v-model="checkbox1" label="Unchecked" />
          <NeumorphismCheckbox v-model="checkbox2" label="Checked" />
          <NeumorphismCheckbox v-model="checkboxIndeterminate" :indeterminate="true" label="Indeterminate" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Sizes</h3>
        <div class="demo-row">
          <NeumorphismCheckbox v-model="checkbox1" label="Small" size="small" />
          <NeumorphismCheckbox v-model="checkbox1" label="Medium" size="medium" />
          <NeumorphismCheckbox v-model="checkbox1" label="Large" size="large" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Disabled & Readonly</h3>
        <div class="demo-row">
          <NeumorphismCheckbox :model-value="true" label="Disabled On" disabled />
          <NeumorphismCheckbox :model-value="false" label="Disabled Off" disabled />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- RADIO -->
    <!-- ======================================================= -->
    <section id="radio" class="showcase-section">
      <h2 class="section-title">NeumorphismRadio & RadioGroup</h2>
      <p class="section-desc">Radio buttons with spring-scale dot animation and RadioGroup for managed state.</p>

      <div class="subsection">
        <h3 class="subsection-title">RadioGroup (horizontal)</h3>
        <NeumorphismRadioGroup v-model="radio1" direction="horizontal">
          <NeumorphismRadio value="a" label="Option A" />
          <NeumorphismRadio value="b" label="Option B" />
          <NeumorphismRadio value="c" label="Option C (disabled)" :disabled="true" />
        </NeumorphismRadioGroup>
        <p style="margin-top: 8px; color: var(--nm-text-secondary); font-size: 13px;">
          Selected: <strong>{{ radio1 }}</strong>
        </p>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">RadioGroup (vertical), sizes</h3>
        <NeumorphismRadioGroup v-model="radio2" direction="vertical" size="small">
          <NeumorphismRadio value="small" label="Small" />
          <NeumorphismRadio value="medium" label="Medium" />
          <NeumorphismRadio value="large" label="Large" />
        </NeumorphismRadioGroup>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- INPUT -->
    <!-- ======================================================= -->
    <section id="input" class="showcase-section">
      <h2 class="section-title">NeumorphismInput</h2>
      <p class="section-desc">Text input with inset shadow, focus glow ring, error state, and prefix/suffix slots.</p>

      <div class="subsection">
        <h3 class="subsection-title">Sizes</h3>
        <div class="demo-row demo-row--vertical form-demo-width">
          <NeumorphismInput v-model="inputName" size="small" placeholder="Small input" />
          <NeumorphismInput v-model="inputName" size="medium" placeholder="Medium input" />
          <NeumorphismInput v-model="inputName" size="large" placeholder="Large input" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">With label, prefix & suffix</h3>
        <div class="demo-row demo-row--vertical form-demo-width">
          <NeumorphismInput v-model="inputName" label="Username" placeholder="Enter username" :required="true" />
          <NeumorphismInput v-model="inputEmail" placeholder="Search...">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </template>
            <template #suffix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
            </template>
          </NeumorphismInput>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Error, disabled & readonly</h3>
        <div class="demo-row demo-row--vertical form-demo-width">
          <NeumorphismInput placeholder="Error state" error="Please enter a valid email address" />
          <NeumorphismInput model-value="Disabled input" disabled />
          <NeumorphismInput model-value="Readonly value" readonly />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- TEXTAREA -->
    <!-- ======================================================= -->
    <section id="textarea" class="showcase-section">
      <h2 class="section-title">NeumorphismTextarea</h2>
      <p class="section-desc">Multi-line text area with character counter, auto-resize, and error state.</p>

      <div class="demo-row demo-row--vertical form-demo-width">
        <NeumorphismTextarea
          v-model="textareaValue"
          label="Description"
          placeholder="Tell us about your project..."
          :maxlength="200"
          :rows="3"
          :show-count="true"
        />
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- SELECT -->
    <!-- ======================================================= -->
    <section id="select" class="showcase-section">
      <h2 class="section-title">NeumorphismSelect</h2>
      <p class="section-desc">Dropdown select with keyboard navigation (Arrow/Home/End/Escape), clearable, and error state.</p>

      <div class="demo-row" style="gap: 24px; flex-wrap: wrap;">
        <div style="width: 280px;">
          <h3 class="subsection-title">Basic select</h3>
          <NeumorphismSelect
            v-model="select1"
            :options="selectOptions"
            placeholder="Choose a framework"
          />
          <p style="margin-top: 8px; font-size: 13px; color: var(--nm-text-secondary);">
            Selected: <strong>{{ select1 || 'none' }}</strong>
          </p>
        </div>
        <div style="width: 280px;">
          <h3 class="subsection-title">With label & clearable</h3>
          <NeumorphismSelect
            v-model="select2"
            :options="selectOptions"
            label="Framework"
            placeholder="Choose..."
            :clearable="true"
          />
        </div>
        <div style="width: 280px;">
          <h3 class="subsection-title">Disabled</h3>
          <NeumorphismSelect
            :options="selectOptions"
            placeholder="Disabled"
            :disabled="true"
          />
        </div>
        <div style="width: 280px;">
          <h3 class="subsection-title">Error state</h3>
          <NeumorphismSelect
            :options="selectOptions"
            label="Required field"
            placeholder="Choose..."
            error="This field is required"
          />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- FORM -->
    <!-- ======================================================= -->
    <section id="form" class="showcase-section">
      <h2 class="section-title">NeumorphismForm & FormItem</h2>
      <p class="section-desc">Form container with built-in validation rules (required, pattern, minLength, custom validator).</p>

      <NeumorphismCard :elevation="2" style="max-width: 480px;">
        <NeumorphismForm ref="formRef" :model="formModel" :rules="formRules" @submit="handleFormSubmit">
          <NeumorphismFormItem label="Username" name="username" :required="true" :rules="formRules.username">
            <NeumorphismInput v-model="formModel.username" placeholder="At least 3 characters" />
          </NeumorphismFormItem>

          <NeumorphismFormItem label="Email" name="email" :required="true" :rules="formRules.email">
            <NeumorphismInput v-model="formModel.email" placeholder="e.g. user@example.com" />
          </NeumorphismFormItem>

          <NeumorphismFormItem label="Password" name="password" :required="true" :rules="formRules.password">
            <NeumorphismInput v-model="formModel.password" type="password" placeholder="At least 6 characters" />
          </NeumorphismFormItem>

          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <NeumorphismButton type="submit" variant="raised">Submit</NeumorphismButton>
            <NeumorphismButton type="button" variant="flat" @click="formRef?.clearErrors()">Clear errors</NeumorphismButton>
          </div>
        </NeumorphismForm>
      </NeumorphismCard>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- CARD -->
    <!-- ======================================================= -->
    <section id="card" class="showcase-section">
      <h2 class="section-title">NeumorphismCard</h2>
      <p class="section-desc">Unified step-height model: elevation &gt; 0 = raised, &lt; 0 = pressed, hover bulge/sink.</p>

      <div class="subsection">
        <h3 class="subsection-title">Raised (1 to 4)</h3>
        <div class="demo-row demo-row--cards">
          <NeumorphismCard v-for="e in 4" :key="e" :elevation="e" style="width: 160px">
            <strong>{{ e }}</strong>
          </NeumorphismCard>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Pressed (-1 to -4)</h3>
        <div class="demo-row demo-row--cards">
          <NeumorphismCard v-for="e in 4" :key="-e" :elevation="-e" style="width: 160px">
            <strong>{{ -e }}</strong>
          </NeumorphismCard>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Hover bulge (elevation += 2)</h3>
        <div class="demo-row demo-row--cards">
          <NeumorphismCard :elevation="1" hoverable="bulge" style="width: 160px">1 → 3</NeumorphismCard>
          <NeumorphismCard :elevation="-2" hoverable="bulge" style="width: 160px">-2 → 0</NeumorphismCard>
          <NeumorphismCard :elevation="0" hoverable="bulge" style="width: 160px">0 → 2</NeumorphismCard>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">With header & footer</h3>
        <NeumorphismCard :elevation="2" style="max-width: 480px;">
          <template #header>
            <strong>Card Title</strong>
          </template>
          <p>This is the main content area of the card. You can place any components or text here.</p>
          <template #footer>
            <span style="color: var(--nm-text-secondary); font-size: 12px;">Footer information · 2024-01-01</span>
          </template>
        </NeumorphismCard>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- MODAL -->
    <!-- ======================================================= -->
    <section id="modal" class="showcase-section">
      <h2 class="section-title">NeumorphismModal</h2>
      <p class="section-desc">Dialog with backdrop blur, focus trap, Escape key support, and scale-in/out transitions.</p>

      <NeumorphismButton @click="modalVisible = true">Open Modal</NeumorphismButton>

      <NeumorphismModal v-model="modalVisible" title="Example Modal" size="small" @confirm="showToast('success')" @cancel="showToast('info')">
        <p>This is a neumorphism-styled modal dialog.</p>
        <p>It supports focus trap, Escape to close, and backdrop blur.</p>
        <div style="margin-top: 12px;">
          <NeumorphismInput placeholder="Type something inside modal..." />
        </div>
      </NeumorphismModal>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- TOAST -->
    <!-- ======================================================= -->
    <section id="toast" class="showcase-section">
      <h2 class="section-title">NeumorphismToast</h2>
      <p class="section-desc">Stacked toast notifications with enter/leave transitions, positioned via prop.</p>

      <div class="demo-row">
        <NeumorphismButton variant="flat" @click="showToast('info')">Info</NeumorphismButton>
        <NeumorphismButton variant="flat" @click="showToast('success')">Success</NeumorphismButton>
        <NeumorphismButton variant="flat" @click="showToast('warning')">Warning</NeumorphismButton>
        <NeumorphismButton variant="flat" @click="showToast('error')">Error</NeumorphismButton>
      </div>

      <NeumorphismToastProvider ref="toastContainer" position="top-right" :max-count="5" />
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- TOOLTIP -->
    <!-- ======================================================= -->
    <section id="tooltip" class="showcase-section">
      <h2 class="section-title">NeumorphismTooltip</h2>
      <p class="section-desc">Tooltip with hover/click/focus triggers and 4-position placement (top/bottom/left/right).</p>

      <div class="demo-row" style="padding: 32px 0;">
        <NeumorphismTooltip content="Top tooltip" position="top">
          <NeumorphismButton variant="pressed" size="small">Hover (top)</NeumorphismButton>
        </NeumorphismTooltip>
        <NeumorphismTooltip content="Bottom tooltip" position="bottom">
          <NeumorphismButton variant="pressed" size="small">Hover (bottom)</NeumorphismButton>
        </NeumorphismTooltip>
        <NeumorphismTooltip content="Left tooltip" position="left">
          <NeumorphismButton variant="pressed" size="small">Hover (left)</NeumorphismButton>
        </NeumorphismTooltip>
        <NeumorphismTooltip content="Right tooltip" position="right">
          <NeumorphismButton variant="pressed" size="small">Hover (right)</NeumorphismButton>
        </NeumorphismTooltip>
        <NeumorphismTooltip position="top" trigger="click">
          <NeumorphismButton variant="flat" size="small">Click me</NeumorphismButton>
          <template #content>
            <span>Custom <strong>rich</strong> content</span>
          </template>
        </NeumorphismTooltip>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- TABS -->
    <!-- ======================================================= -->
    <section id="tabs" class="showcase-section">
      <h2 class="section-title">NeumorphismTabs</h2>
      <p class="section-desc">Tab navigation with neumorphic active state, keyboard navigation (Arrow keys), and horizontal/vertical layout.</p>

      <div class="subsection">
        <h3 class="subsection-title">Top position (default)</h3>
        <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="top" />
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Left position</h3>
        <div style="max-width: 400px;">
          <NeumorphismTabs v-model="activeTab" :tabs="tabItems" position="left" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- BREADCRUMB -->
    <!-- ======================================================= -->
    <section id="breadcrumb" class="showcase-section">
      <h2 class="section-title">NeumorphismBreadcrumb</h2>
      <p class="section-desc">Breadcrumb navigation with link and text items, customizable separator, ARIA landmarks.</p>

      <NeumorphismBreadcrumb :items="breadcrumbItems" separator="/" />
        <div style="margin-top: 12px;">
          <NeumorphismBreadcrumb :items="breadcrumbItems" separator=">" size="small" />
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- PAGINATION -->
    <!-- ======================================================= -->
    <section id="pagination" class="showcase-section">
      <h2 class="section-title">NeumorphismPagination</h2>
      <p class="section-desc">Pagination with ellipsis, total display, jumper input, and neumorphic page buttons.</p>

      <div class="subsection">
        <h3 class="subsection-title">Basic (10 pages)</h3>
        <NeumorphismPagination v-model="page" :total="100" :page-size="10" />
        <p style="margin-top: 8px; font-size: 13px; color: var(--nm-text-secondary);">
          Current page: <strong>{{ page }}</strong>
        </p>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">With total & jumper</h3>
        <NeumorphismPagination
          v-model="page2"
          :total="500"
          :page-size="20"
          :show-total="true"
          :show-jumper="true"
        />
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Sizes</h3>
        <div class="demo-row demo-row--vertical" style="gap: 16px;">
          <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="small" />
          <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="medium" />
          <NeumorphismPagination v-model="page" :total="50" :page-size="10" size="large" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- COLLAPSE -->
    <!-- ======================================================= -->
    <section id="collapse" class="showcase-section">
      <h2 class="section-title">NeumorphismCollapse</h2>
      <p class="section-desc">Accordion/collapse with spring-like expand animation, accordion mode, keyboard support.</p>

      <NeumorphismCollapse v-model="collapseActive" :items="collapseItems">
        <template #item1>
          <p>Neumorphism (Soft UI) is a design trend that uses shadows and highlights to create a soft, extruded plastic-like look. Elements appear to be protruding from or pressing into the background.</p>
        </template>
        <template #item2>
          <p>Install with <code>npm install @echolab/ui-frame</code>, then import components or use <code>app.use(NeumorphismUI)</code> for global registration.</p>
        </template>
        <template #item3>
          <p>This item is disabled.</p>
        </template>
      </NeumorphismCollapse>

      <div style="margin-top: 16px;">
        <NeumorphismButton size="small" variant="flat" @click="collapseActive = collapseActive.length ? [] : ['item1', 'item2']">
          {{ collapseActive.length ? 'Collapse All' : 'Expand All' }}
        </NeumorphismButton>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- AVATAR -->
    <!-- ======================================================= -->
    <section id="avatar" class="showcase-section">
      <h2 class="section-title">NeumorphismAvatar</h2>
      <p class="section-desc">Avatar component with image or initials fallback, circle/rounded shape, three sizes.</p>

      <div class="subsection">
        <h3 class="subsection-title">Sizes & shape</h3>
        <div class="demo-row">
          <NeumorphismAvatar initials="JD" size="small" />
          <NeumorphismAvatar initials="JD" size="medium" />
          <NeumorphismAvatar initials="JD" size="large" />
          <NeumorphismAvatar initials="JD" size="medium" shape="rounded" />
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">With image (fallback on error)</h3>
        <div class="demo-row">
          <NeumorphismAvatar src="https://i.pravatar.cc/64?img=1" alt="User" size="medium" />
          <NeumorphismAvatar src="https://invalid.url/img.jpg" initials="ER" size="medium" alt="User" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- BADGE -->
    <!-- ======================================================= -->
    <section id="badge" class="showcase-section">
      <h2 class="section-title">NeumorphismBadge</h2>
      <p class="section-desc">Badge for counts or dot indicators, positioned over a child element.</p>

      <div class="subsection">
        <h3 class="subsection-title">Count badges & dot</h3>
        <div class="demo-row" style="gap: 32px;">
          <NeumorphismBadge :value="5">
            <NeumorphismButton variant="pressed" size="small">Inbox</NeumorphismButton>
          </NeumorphismBadge>
          <NeumorphismBadge :value="120" :max="99">
            <NeumorphismButton variant="pressed" size="small">Messages</NeumorphismButton>
          </NeumorphismBadge>
          <NeumorphismBadge dot>
            <NeumorphismAvatar initials="AB" size="medium" />
          </NeumorphismBadge>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- TAG -->
    <!-- ======================================================= -->
    <section id="tag" class="showcase-section">
      <h2 class="section-title">NeumorphismTag</h2>
      <p class="section-desc">Tag/chip component with colored variants and optional close button.</p>

      <div class="subsection">
        <h3 class="subsection-title">Variants</h3>
        <div class="demo-row">
          <NeumorphismTag>Default</NeumorphismTag>
          <NeumorphismTag variant="primary">Primary</NeumorphismTag>
          <NeumorphismTag variant="success">Success</NeumorphismTag>
          <NeumorphismTag variant="warning">Warning</NeumorphismTag>
          <NeumorphismTag variant="error">Error</NeumorphismTag>
          <NeumorphismTag variant="info">Info</NeumorphismTag>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Closable & sizes</h3>
        <div class="demo-row">
          <NeumorphismTag
            v-if="tagVisible"
            variant="primary"
            :closable="true"
            @close="tagVisible = false"
          >Closable</NeumorphismTag>
          <NeumorphismTag variant="success" size="small">Small</NeumorphismTag>
          <NeumorphismTag variant="warning" size="large">Large</NeumorphismTag>
          <NeumorphismTag variant="error" rounded>Rounded</NeumorphismTag>
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- PROGRESS -->
    <!-- ======================================================= -->
    <section id="progress" class="showcase-section">
      <h2 class="section-title">NeumorphismProgress</h2>
      <p class="section-desc">Progress bar with colored variants, label, indeterminate, striped, and spring easing.</p>

      <div class="subsection">
        <h3 class="subsection-title">Variants & label</h3>
        <div class="demo-row demo-row--vertical form-demo-width" style="gap: 16px;">
          <NeumorphismProgress :model-value="progressVal" variant="primary" :show-label="true" />
          <NeumorphismProgress :model-value="progressVal" variant="success" />
          <NeumorphismProgress :model-value="progressVal" variant="warning" />
          <NeumorphismProgress :model-value="progressVal" variant="error" :show-label="true" />
        </div>
        <div class="demo-row" style="margin-top: 12px; gap: 12px;">
          <NeumorphismButton size="small" variant="flat" @click="progressVal = Math.max(0, progressVal - 10)">-10%</NeumorphismButton>
          <NeumorphismButton size="small" variant="flat" @click="progressVal = Math.min(100, progressVal + 10)">+10%</NeumorphismButton>
          <NeumorphismButton size="small" variant="flat" @click="indeterminate = !indeterminate">
            {{ indeterminate ? 'Stop' : 'Indeterminate' }}
          </NeumorphismButton>
        </div>
      </div>

      <div class="subsection" style="margin-top: 16px;">
        <h3 class="subsection-title">Indeterminate & Sizes</h3>
        <div class="demo-row demo-row--vertical form-demo-width" style="gap: 16px;">
          <NeumorphismProgress v-if="indeterminate" :indeterminate="true" variant="primary" />
          <NeumorphismProgress :model-value="progressVal" size="small" />
          <NeumorphismProgress :model-value="progressVal" size="medium" />
          <NeumorphismProgress :model-value="progressVal" size="large" />
        </div>
      </div>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- SKELETON -->
    <!-- ======================================================= -->
    <section id="skeleton" class="showcase-section">
      <h2 class="section-title">NeumorphismSkeleton</h2>
      <p class="section-desc">Skeleton loading placeholder with text/circle/rect variants, pulse/wave animation.</p>

      <div class="demo-row" style="gap: 12px;">
        <NeumorphismButton size="small" variant="flat" @click="skeletonLoading = !skeletonLoading">
          {{ skeletonLoading ? 'Hide skeleton' : 'Show skeleton' }}
        </NeumorphismButton>
      </div>

      <div v-if="skeletonLoading" style="margin-top: 16px;">
        <div class="demo-row" style="align-items: center; gap: 16px; margin-bottom: 16px;">
          <NeumorphismSkeleton variant="circle" :width="44" :height="44" />
          <div style="flex: 1;">
            <NeumorphismSkeleton variant="text" width="60%" />
            <NeumorphismSkeleton variant="text" width="40%" />
          </div>
        </div>
        <NeumorphismSkeleton variant="rect" :height="120" animation="wave" style="margin-bottom: 12px;" />
        <NeumorphismSkeleton variant="text" />
        <NeumorphismSkeleton variant="text" />
        <NeumorphismSkeleton variant="text" width="80%" />
      </div>

      <NeumorphismCard v-else :elevation="1" style="max-width: 480px; margin-top: 16px;">
        <p><strong>Content loaded!</strong></p>
        <p style="color: var(--nm-text-secondary); font-size: 13px;">This replaces the skeleton placeholder above.</p>
      </NeumorphismCard>
    </section>

    <NeumorphismDivider />

    <!-- ======================================================= -->
    <!-- DIVIDER -->
    <!-- ======================================================= -->
    <section id="divider" class="showcase-section">
      <h2 class="section-title">NeumorphismDivider</h2>
      <p class="section-desc">Horizontal or vertical separator with optional text content and dashed style.</p>

      <div class="subsection">
        <h3 class="subsection-title">Horizontal with text</h3>
        <NeumorphismDivider>Section A</NeumorphismDivider>
        <p style="color: var(--nm-text-secondary); font-size: 13px;">Content between dividers</p>
        <NeumorphismDivider align="left">Left aligned</NeumorphismDivider>
        <p style="color: var(--nm-text-secondary); font-size: 13px;">Content</p>
        <NeumorphismDivider align="right" dashed>Right aligned (dashed)</NeumorphismDivider>
      </div>

      <div class="subsection">
        <h3 class="subsection-title">Vertical</h3>
        <div class="demo-row">
          <span>Left</span>
          <NeumorphismDivider direction="vertical" />
          <span>Middle</span>
          <NeumorphismDivider direction="vertical" dashed />
          <span>Right</span>
        </div>
      </div>
    </section>

    <!-- ===== FOOTER ===== -->
    <footer class="showcase-footer">
      <NeumorphismDivider />
      <p>@echolab/ui-frame · MIT License · {{ 23 }} Components</p>
      <p style="margin-top: 4px;">
        <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a> ·
        <a href="https://www.npmjs.com/package/@echolab/ui-frame" target="_blank">npm</a>
      </p>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '../src/styles/variables.scss' as *;

.showcase {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  min-height: 100vh;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition: background-color var(--nm-transition-slow), color var(--nm-transition-slow);
}

// ---- Header ----
.showcase-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}

.showcase-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -1px;
}

.showcase-subtitle {
  font-size: 16px;
  color: var(--nm-text-secondary);
  margin: 0 0 20px;
}

.showcase-theme-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.showcase-theme-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-secondary);
}

// ---- Navigation ----
.showcase-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 48px;
  padding: 12px 16px;
  background-color: var(--nm-surface-color);
  border-radius: var(--nm-border-radius-md);
  @include nm-inset(2px, 5px);

  a {
    padding: 4px 12px;
    font-size: 13px;
    color: var(--nm-text-secondary);
    text-decoration: none;
    border-radius: var(--nm-border-radius-sm);
    transition: all var(--nm-transition-fast);

    &:hover {
      color: var(--nm-primary-color);
      background-color: var(--nm-surface-raised);
    }
  }
}

// ---- Sections ----
.showcase-section {
  margin-bottom: 20px;
  scroll-margin-top: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
}

.section-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

.subsection {
  margin-bottom: 24px;
}

.subsection-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--nm-text-placeholder);
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

// ---- Demos ----
.demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  &--vertical {
    flex-direction: column;
    align-items: flex-start;
  }

  &--cards {
    align-items: stretch;
  }
}

.form-demo-width {
  max-width: 420px;
}

// ---- Footer ----
.showcase-footer {
  text-align: center;
  margin-top: 48px;
  padding-top: 32px;
  color: var(--nm-text-secondary);
  font-size: 13px;

  a {
    color: var(--nm-primary-color);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>
