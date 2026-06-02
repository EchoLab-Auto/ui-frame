<script setup lang="ts">
import { ref } from 'vue'

const switchValue = ref(false)
const switchValue2 = ref(true)
const inputValue = ref('')
const inputValue2 = ref('')
const inputValue3 = ref('')
</script>

<template>
  <ThemeProvider default-theme="auto" v-slot="{ isDark, toggleTheme }">
    <div class="showcase">
      <!-- Header -->
      <header class="showcase-header">
        <h1 class="showcase-title">@echolab/ui-frame</h1>
        <p class="showcase-subtitle">Vue 3 新拟态 UI 组件库</p>
        <div class="showcase-theme-toggle">
          <NeumorphismButton variant="raised" size="small" @click="toggleTheme">
            {{ isDark ? '切换到亮色' : '切换到暗色' }}
          </NeumorphismButton>
        </div>
      </header>

      <!-- Button Section -->
      <section class="showcase-section">
        <h2 class="section-title">NeumorphismButton 按钮</h2>
        <p class="section-desc">带有柔和凸起或凹陷阴影效果的按钮</p>

        <div class="subsection">
          <h3 class="subsection-title">变体 (variant)</h3>
          <div class="demo-row">
            <NeumorphismButton variant="raised">凸起 (raised)</NeumorphismButton>
            <NeumorphismButton variant="flat">扁平 (flat)</NeumorphismButton>
            <NeumorphismButton variant="pressed">凹陷 (pressed)</NeumorphismButton>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">尺寸 (size)</h3>
          <div class="demo-row">
            <NeumorphismButton size="small">小尺寸</NeumorphismButton>
            <NeumorphismButton size="medium">中尺寸</NeumorphismButton>
            <NeumorphismButton size="large">大尺寸</NeumorphismButton>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">形状 (shape)</h3>
          <div class="demo-row">
            <NeumorphismButton shape="rounded">圆角</NeumorphismButton>
            <NeumorphismButton shape="pill">胶囊</NeumorphismButton>
            <NeumorphismButton shape="circle" size="medium">+</NeumorphismButton>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">状态</h3>
          <div class="demo-row">
            <NeumorphismButton disabled>禁用</NeumorphismButton>
            <NeumorphismButton loading>加载中</NeumorphismButton>
          </div>
        </div>
      </section>

      <!-- Switch Section -->
      <section class="showcase-section">
        <h2 class="section-title">NeumorphismSwitch 开关</h2>
        <p class="section-desc">带有太阳/月亮图标的主题切换开关</p>

        <div class="subsection">
          <h3 class="subsection-title">尺寸 (size)</h3>
          <div class="demo-row demo-row--vertical">
            <NeumorphismSwitch v-model="switchValue" size="small" />
            <NeumorphismSwitch v-model="switchValue" size="medium" />
            <NeumorphismSwitch v-model="switchValue" size="large" />
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">带文本标签</h3>
          <div class="demo-row">
            <NeumorphismSwitch
              v-model="switchValue2"
              active-text="暗色"
              inactive-text="亮色"
              size="medium"
            />
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">禁用状态</h3>
          <div class="demo-row">
            <NeumorphismSwitch :model-value="true" disabled />
            <NeumorphismSwitch :model-value="false" disabled />
          </div>
        </div>
      </section>

      <!-- Card Section -->
      <section class="showcase-section">
        <h2 class="section-title">NeumorphismCard 卡片</h2>
        <p class="section-desc">统一台阶高度模型：elevation &gt; 0 凸起，&lt; 0 凹陷，0 平齐</p>

        <div class="subsection">
          <h3 class="subsection-title">凸起台阶 (elevation 1–4)</h3>
          <div class="demo-row demo-row--cards">
            <NeumorphismCard :elevation="1" style="width: 180px">elevation: 1</NeumorphismCard>
            <NeumorphismCard :elevation="2" style="width: 180px">elevation: 2</NeumorphismCard>
            <NeumorphismCard :elevation="3" style="width: 180px">elevation: 3</NeumorphismCard>
            <NeumorphismCard :elevation="4" style="width: 180px">elevation: 4</NeumorphismCard>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">凹陷台阶 (elevation -1 至 -4)</h3>
          <div class="demo-row demo-row--cards">
            <NeumorphismCard :elevation="-1" style="width: 180px">elevation: -1</NeumorphismCard>
            <NeumorphismCard :elevation="-2" style="width: 180px">elevation: -2</NeumorphismCard>
            <NeumorphismCard :elevation="-3" style="width: 180px">elevation: -3</NeumorphismCard>
            <NeumorphismCard :elevation="-4" style="width: 180px">elevation: -4</NeumorphismCard>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">悬停膨胀 (hoverable="bulge" — elevation += 2)</h3>
          <div class="demo-row demo-row--cards">
            <NeumorphismCard :elevation="1" hoverable="bulge" style="width: 180px">
              1 → 3
            </NeumorphismCard>
            <NeumorphismCard :elevation="2" hoverable="bulge" style="width: 180px">
              2 → 4
            </NeumorphismCard>
            <NeumorphismCard :elevation="-2" hoverable="bulge" style="width: 180px">
              -2 → 0
            </NeumorphismCard>
            <NeumorphismCard :elevation="0" hoverable="bulge" style="width: 180px">
              0 → 2
            </NeumorphismCard>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">悬停下沉 (hoverable="sink" — elevation -= 2)</h3>
          <div class="demo-row demo-row--cards">
            <NeumorphismCard :elevation="-1" hoverable="sink" style="width: 180px">
              -1 → -3
            </NeumorphismCard>
            <NeumorphismCard :elevation="-2" hoverable="sink" style="width: 180px">
              -2 → -4
            </NeumorphismCard>
            <NeumorphismCard :elevation="2" hoverable="sink" style="width: 180px">
              2 → 0
            </NeumorphismCard>
            <NeumorphismCard :elevation="0" hoverable="sink" style="width: 180px">
              0 → -2
            </NeumorphismCard>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">带头部和底部</h3>
          <div class="demo-row">
            <NeumorphismCard :elevation="2" style="width: 400px">
              <template #header>
                <strong>卡片标题</strong>
              </template>
              这是卡片的主要内容区域，可以放置任意内容。
              <template #footer>
                <span style="color: var(--nm-text-secondary); font-size: 12px;">2024-01-01</span>
              </template>
            </NeumorphismCard>
          </div>
        </div>
      </section>

      <!-- Input Section -->
      <section class="showcase-section">
        <h2 class="section-title">NeumorphismInput 输入框</h2>
        <p class="section-desc">带有柔和凹陷阴影效果的输入框</p>

        <div class="subsection">
          <h3 class="subsection-title">尺寸 (size)</h3>
          <div class="demo-row demo-row--vertical" style="max-width: 400px">
            <NeumorphismInput v-model="inputValue" size="small" placeholder="小尺寸输入框" />
            <NeumorphismInput v-model="inputValue" size="medium" placeholder="中尺寸输入框" />
            <NeumorphismInput v-model="inputValue" size="large" placeholder="大尺寸输入框" />
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">带标签</h3>
          <div class="demo-row" style="max-width: 400px">
            <NeumorphismInput
              v-model="inputValue2"
              label="用户名"
              placeholder="请输入用户名"
              :required="true"
            />
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">前后缀插槽</h3>
          <div class="demo-row" style="max-width: 400px">
            <NeumorphismInput v-model="inputValue3" placeholder="带前后缀">
              <template #prefix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </template>
              <template #suffix>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </template>
            </NeumorphismInput>
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">错误状态</h3>
          <div class="demo-row" style="max-width: 400px">
            <NeumorphismInput
              placeholder="错误状态演示"
              error="请输入有效的邮箱地址"
            />
          </div>
        </div>

        <div class="subsection">
          <h3 class="subsection-title">禁用/只读</h3>
          <div class="demo-row" style="max-width: 400px">
            <NeumorphismInput model-value="禁用状态" disabled />
            <NeumorphismInput model-value="只读状态" readonly />
          </div>
        </div>
      </section>

      <!-- ThemeProvider Section -->
      <section class="showcase-section">
        <h2 class="section-title">ThemeProvider 主题管理</h2>
        <p class="section-desc">管理应用全局的亮色/暗色主题状态</p>

        <div class="subsection">
          <h3 class="subsection-title">当前主题</h3>
          <div class="demo-row">
            <NeumorphismCard :elevation="2" style="width: 300px">
              <p>当前是否为暗色主题：<strong>{{ isDark ? '是' : '否' }}</strong></p>
              <div style="margin-top: 12px">
                <NeumorphismButton variant="raised" size="small" @click="toggleTheme">
                  {{ isDark ? '切换到亮色' : '切换到暗色' }}
                </NeumorphismButton>
              </div>
            </NeumorphismCard>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="showcase-footer">
        <p>@echolab/ui-frame · MIT License</p>
        <p>
          <a href="https://github.com/EchoLab-Auto/ui-frame" target="_blank">GitHub</a>
        </p>
      </footer>
    </div>
  </ThemeProvider>
</template>

<style scoped lang="scss">
@use '../src/styles/variables.scss' as *;

.showcase {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px;
  min-height: 100vh;
  background-color: var(--nm-bg-color);
  color: var(--nm-text-primary);
  transition: background-color var(--nm-transition-slow), color var(--nm-transition-slow);
}

.showcase-header {
  text-align: center;
  margin-bottom: 64px;
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}

.showcase-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--nm-text-primary);
  letter-spacing: -1px;
}

.showcase-subtitle {
  font-size: 18px;
  color: var(--nm-text-secondary);
  margin: 0 0 24px;
}

.showcase-theme-toggle {
  margin-top: 16px;
}

.showcase-section {
  margin-bottom: 56px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--nm-text-primary);
}

.section-desc {
  font-size: 14px;
  color: var(--nm-text-secondary);
  margin: 0 0 24px;
}

.subsection {
  margin-bottom: 32px;
}

.subsection-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--nm-text-secondary);
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;

  &--vertical {
    flex-direction: column;
    align-items: flex-start;
  }

  &--cards {
    align-items: stretch;
  }
}

.showcase-footer {
  text-align: center;
  padding-top: 48px;
  margin-top: 64px;
  border-top: 1px solid rgba(128, 128, 128, 0.15);
  color: var(--nm-text-secondary);
  font-size: 14px;

  a {
    color: var(--nm-primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
