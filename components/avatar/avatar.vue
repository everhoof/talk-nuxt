<template>
  <!-- begin .avatar-->
  <b-user-avatar
    class="avatar"
    :class="{
      avatar_size_tiny: tiny,
      avatar_size_medium: medium,
      avatar_size_large: large,
      avatar_size_stretch: stretch,
    }"
    :username="username"
    :user-id="userId"
    :src="avatar"
  >
    <label v-if="isOwner && !loading" for="avatar-upload" class="avatar__upload">
      <svg-icon class="avatar__upload-icon" name="upload" />
      <input id="avatar-upload" class="avatar__upload-input" type="file" @change="onFileChanged" />
    </label>
    <div v-if="loading" class="avatar__loading">
      <img class="avatar__loading-image" src="@/assets/icons/loading.png" alt="loading" />
    </div>
  </b-user-avatar>
  <!-- end .avatar-->
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator';
import { UpdateAvatarMutation, UpdateAvatarMutationVariables, User } from '~/graphql/schema';
import BUserAvatar from '~/components/user-avatar/user-avatar.vue';
import UpdateAvatar from '~/graphql/mutations/update-avatar.graphql';
import { HttpClient } from '~/tools/http-client';

@Component({
  name: 'b-avatar',
  components: { BUserAvatar },
})
export default class Avatar extends Vue {
  @Prop({ required: true }) user?: User;
  @Prop({ required: false, type: Boolean, default: false }) tiny!: boolean;
  @Prop({ required: false, type: Boolean, default: false }) medium!: boolean;
  @Prop({ required: false, type: Boolean, default: false }) large!: boolean;
  @Prop({ required: false, type: Boolean, default: false }) stretch!: boolean;

  private loading: boolean = false;

  get username(): string {
    return this.user?.username || '';
  }

  get userId(): number | undefined {
    return this.user?.id;
  }

  get avatar(): string {
    return this.user?.avatar?.s.link || '';
  }

  get isOwner(): boolean {
    const currentUser = this.$accessor.auth.user;

    if (!currentUser || !this.user) {
      return false;
    }

    return currentUser.id === this.user.id;
  }

  async onFileChanged(e: Event & { target: { files: File[] } }) {
    this.loading = true;
    try {
      const file = e.target.files[0];
      const id = await HttpClient.uploadPicture(file);

      if (id) {
        await this.updateAvatar(id);
      }
    } finally {
      this.loading = false;
    }
  }

  async updateAvatar(pictureId: number): Promise<void> {
    const { errors, data } = await this.$apollo.mutate<UpdateAvatarMutation, UpdateAvatarMutationVariables>({
      mutation: UpdateAvatar,
      variables: { pictureId },
    });

    if (errors || !data?.updateAvatar) {
      return;
    }

    const user = this.$accessor.auth.user;

    if (user) {
      user.avatar = data?.updateAvatar.avatar;
      this.$accessor.auth.SET_USER(user);
    }
  }
}
</script>

<style lang="stylus" src="./avatar.styl" />
