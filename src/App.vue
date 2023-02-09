<script setup>
import { ref } from 'vue';
import SettingsIcon from '@rugo-vn/vue/dist/ionicons/SettingsIcon.vue';
import CloseIcon from '@rugo-vn/vue/dist/ionicons/CloseIcon.vue';

import { useAppStore } from './stores/app';
import { RouterView } from 'vue-router';

const appStore = useAppStore();

const isSettingPanelOpened = ref(false);
const toggleSettingPanel = () => {
  isSettingPanelOpened.value = !isSettingPanelOpened.value;
};
</script>

<template>
  <div class="fixed z-[30] shadow-md top-0 left-0 w-screen">
    <RTopBar :rightIcon="SettingsIcon" @action="toggleSettingPanel" />

    <div
      :class="`fixed z-30 top-0 h-screen transition-all w-80 ${
        isSettingPanelOpened ? 'right-0' : 'right-[-20rem]'
      }`"
    >
      <label
        class="bg-black w-screen h-screen block opacity-30 left-0 fixed"
        @click="toggleSettingPanel"
        v-if="isSettingPanelOpened"
      ></label>

      <div class="absolute bg-white top-0 right-0 w-full h-screen shadow-md">
        <RTopBar :rightIcon="CloseIcon" @action="toggleSettingPanel">
          <template #logo>Settings</template>
        </RTopBar>

        <div class="px-4">
          <RInput label="Email" v-model="appStore.user.email" />
          <RInput
            label="Password"
            type="password"
            v-model="appStore.user.password"
          />

          <div class="flex justify-evenly">
            <RButton
              variant="primary"
              class="w-24 justify-center"
              v-if="appStore.isNotUpToDate"
              @click="appStore.loadFromCloud"
              >Load</RButton
            >
            <RButton
              variant="primary"
              class="w-24 justify-center"
              @click="appStore.saveToCloud"
              v-if="appStore.isChanged"
              >Save</RButton
            >
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-20"></div>

  <RouterView />

  <RNotification :notices="appStore.notice.data" />
</template>

<style scoped></style>