<script setup lang="ts">
/**
 * 层叠联动验证 —— 人工 QA 用例，不是「好看的展示」。
 *
 * 场景：模态框（Teleport 到 body）内嵌 Form + 4 个 Select，另外再塞一个 Tooltip
 * 和一个 Popover。只要 z-index 层叠公式或 position:fixed 定位有一处回归，
 * 这里点开就能看见下拉面板被遮罩盖住 / 跟着页面滚走。
 *
 * 所以本文件刻意**不加配置台**：任何参数化都会让场景偏离开发者反馈的原貌。
 */
import { ref } from 'vue'

const layerTestVisible = ref(false)
const layerTestName = ref('')
const layerTestRole = ref('')
const layerTestType = ref('')
const layerTestStatus = ref('')

const layerTestInterfaceOptions = [
  { label: 'eth0 (默认网关)', value: 'eth0' },
  { label: 'eth1 (内网)', value: 'eth1' },
  { label: 'wlan0 (无线)', value: 'wlan0' },
  { label: 'br0 (桥接)', value: 'br0' },
  { label: 'lo (回环)', value: 'lo', disabled: true },
]

const layerTestRoleOptions = [
  { label: 'WAN', value: 'wan' },
  { label: 'LAN', value: 'lan' },
  { label: 'DMZ', value: 'dmz' },
  { label: 'Guest', value: 'guest' },
]

const layerTestTypeOptions = [
  { label: '静态 IP', value: 'static' },
  { label: 'DHCP', value: 'dhcp' },
  { label: 'PPPoE', value: 'pppoe' },
  { label: 'VPN', value: 'vpn', disabled: true },
]

const layerTestStatusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
  { label: '待配置', value: 'pending' },
]

/** 复跑一次要能在同一个会话里反复验证，所以给一个清空值的入口 */
function resetLayerTest() {
  layerTestName.value = ''
  layerTestRole.value = ''
  layerTestType.value = ''
  layerTestStatus.value = ''
}
</script>

<template>
  <div class="demo-block">
    <p class="demo-hint" style="margin: 0 0 12px">
      此 Demo 复现开发者反馈的典型场景：<strong>模态框内嵌表单 + 多个 Select</strong>， 用于人工验证
      Select 下拉框是否正常显示在遮罩之上（v1.0.5 已修复 z-index 层叠公式）。
      建议<strong>滚动页面后</strong>再打开，同时验证 Popover/AutoComplete 的 position:fixed
      定位是否受滚动影响。
    </p>

    <div
      style="
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px dashed var(--nm-text-placeholder);
        border-radius: var(--nm-border-radius-md);
      "
    >
      <NeumorphismButton @click="layerTestVisible = true">打开层叠测试模态框</NeumorphismButton>
      <NeumorphismButton variant="pressed" size="small" @click="resetLayerTest()"
        >清空当前值</NeumorphismButton
      >
      <span style="font-size: 13px; color: var(--nm-text-secondary)">
        当前值 — 接口: <strong>{{ layerTestName || '未选择' }}</strong> · 角色:
        <strong>{{ layerTestRole || '未选择' }}</strong> · 类型:
        <strong>{{ layerTestType || '未选择' }}</strong> · 状态:
        <strong>{{ layerTestStatus || '未选择' }}</strong>
      </span>
    </div>

    <NeumorphismModal v-model="layerTestVisible" title="网络接口配置（层叠联动验证）" size="medium">
      <NeumorphismForm>
        <NeumorphismFormItem label="接口名称" :required="true">
          <NeumorphismSelect
            v-model="layerTestName"
            :options="layerTestInterfaceOptions"
            placeholder="请选择网络接口"
          />
        </NeumorphismFormItem>

        <NeumorphismFormItem label="角色">
          <NeumorphismSelect
            v-model="layerTestRole"
            :options="layerTestRoleOptions"
            placeholder="请选择角色"
          />
        </NeumorphismFormItem>

        <NeumorphismFormItem label="地址类型">
          <NeumorphismSelect
            v-model="layerTestType"
            :options="layerTestTypeOptions"
            placeholder="请选择地址类型"
          />
        </NeumorphismFormItem>

        <NeumorphismFormItem label="运行状态">
          <NeumorphismSelect
            v-model="layerTestStatus"
            :options="layerTestStatusOptions"
            placeholder="请选择状态"
          />
        </NeumorphismFormItem>

        <!-- 内联提示：同时在 Modal 内放置 Tooltip 和 Popover 以验证多维层叠 -->
        <div
          style="
            display: flex;
            gap: 12px;
            align-items: center;
            margin-top: 8px;
            padding: 10px 14px;
            border-radius: var(--nm-border-radius-sm);
            background: var(--nm-surface-raised);
          "
        >
          <span style="font-size: 12px; color: var(--nm-text-secondary)">附加验证：</span>
          <NeumorphismTooltip content="Tooltip 应在遮罩之上" position="top">
            <NeumorphismButton variant="pressed" size="small">悬停 Tooltip</NeumorphismButton>
          </NeumorphismTooltip>
          <NeumorphismPopover trigger="click" position="bottom" content="Popover 应在遮罩之上">
            <NeumorphismButton size="small">点击 Popover</NeumorphismButton>
          </NeumorphismPopover>
        </div>
      </NeumorphismForm>
    </NeumorphismModal>
  </div>

  <div class="demo-block">
    <h4 class="demo-label">人工验证清单</h4>
    <ul class="demo-hint" style="margin: 0; padding-left: 18px; line-height: 1.9">
      <li>逐个打开 4 个 Select：下拉面板必须完整显示在<b>遮罩之上</b>，不能被模态框边界裁切</li>
      <li>
        <b>先把页面滚到中间</b>再打开：Select 面板与 Tooltip / Popover 都用
        <code>position: fixed</code> 定位，浮层应贴着触发器而不是随内容偏移
      </li>
      <li>Tooltip 悬停、Popover 点击，两个浮层同样要在遮罩之上</li>
      <li>同一时刻只应存在一个打开的下拉面板（打开第二个时第一个自动收起）</li>
      <li>
        <kbd>Esc</kbd> 或点遮罩关闭后，焦点应回到「打开层叠测试模态框」按钮；页面滚动锁同步解除
      </li>
      <li><code>lo (回环)</code> 与 <code>VPN</code> 两项是 disabled，键盘上下导航时应被跳过</li>
    </ul>
  </div>
</template>
