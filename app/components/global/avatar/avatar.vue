<template>
  <!-- begin .avatar-->
  <b-user-avatar
    :class="classNames"
    :username="username"
    :user-id="userId"
    :src="avatar"
  >
    <template v-if="isOwner && !loading">
      <label for="avatar-upload" class="avatar__upload">
        <svg-icon class="avatar__upload-icon" name="upload" />
        <input
          id="avatar-upload"
          class="avatar__upload-input"
          type="file"
          @change="onFileChanged"
        />
      </label>
    </template>
    <template v-if="loading">
      <div class="avatar__loading">
        <img class="avatar__loading-image" src="@/assets/icons/loading.png" alt="loading" />
      </div>
    </template>
  </b-user-avatar>
  <!-- end .avatar-->
</template>

<script setup lang="ts">
import type { AvatarProps } from './index';
import {
  flag,
  useBMC,
} from '@rhapsodic/bem-classnames-vue';
import {
  ref,
  computed,
} from 'vue';

import type {
  UpdateAvatarMutation,
  UpdateAvatarMutationVariables,
} from '~/graphql/schema';

import UpdateAvatar from '~/graphql/mutations/update-avatar.graphql';

defineOptions({ name: 'BAvatar' });

const authStore = useAuthStore();
const { client: graphqlClient } = useGraphql();
const uploadPicture = usePictureUpload();

const props = withDefaults(defineProps<AvatarProps>(), {
  tiny: false,
  medium: false,
  large: false,
  stretch: false,
});

const classNames = useBMC(props, 'avatar', {
  tiny: flag('size', 'tiny'),
  medium: flag('size', 'medium'),
  large: flag('size', 'large'),
  stretch: flag('size', 'stretch'),
});

const loading = ref<boolean>(false);

const username = computed((): string => {
  return props.user?.username || '';
});

const userId = computed((): number | undefined => {
  return props.user?.id;
});

const avatar = computed((): string => {
  return props.user?.avatar?.s.link || '';
});

const isOwner = computed((): boolean => {
  const currentUser = authStore.user;
  if (!currentUser || !props.user) {
    return false;
  }
  return currentUser.id === props.user.id;
});

async function onFileChanged(e: Event) {
  loading.value = true;
  try {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const id = await uploadPicture(file);
    if (id) {
      await updateAvatar(id);
    }
  } finally {
    loading.value = false;
  }
}

async function updateAvatar(pictureId: number): Promise<void> {
  const { errors, data } = await graphqlClient.mutate<UpdateAvatarMutation, UpdateAvatarMutationVariables>({
    mutation: UpdateAvatar,
    variables: { pictureId },
  });
  if (errors || !data?.updateAvatar) {
    return;
  }
  const user = authStore.user;
  if (user) {
    user.avatar = data?.updateAvatar.avatar;
    authStore.updateUser(user);
  }
}
</script>

<style lang="scss" src="./avatar.scss">
</style>
