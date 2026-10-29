<template>
  <div @click.stop>
    <div class="container mb-10">
      <div class="top flex justify-content-center align-items-center">
        <el-upload
          class="avatar-uploader"
          action="/api/upload"
          name="image"
          :show-file-list="false"
          :http-request="customUpload"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="imageUrl" :src="imageUrl" class="avatar" />
          <div v-else>
            <el-icon><Upload /></el-icon>
            添加图片
          </div>
        </el-upload>
      </div>
      <div
        class="bottom flex justify-content-center align-items-center flex-direction-column font-weight-500"
      >
        <div class="item">{{ picTitle }}</div>
        <div class="desc mt-5 mb-5">{{ picDesc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'
import type { GetLink } from '@/types'
const props = defineProps({
  picTitle: {
    type: String,
    default: '选项',
  },
  picDesc: {
    type: String,
    default: '说明（选填，限24字）',
  },
  value: {
    type: String,
    default: null,
  },
  index: {
    type: Number,
    default: 0,
  },
})
const imageUrl = ref('')
// 预览的时候不会有注入，所以需要设置默认值
const getPicLink = inject<GetLink>('getPicLink', () => {})

watch(
  () => props.value,
  async (newVal) => {
    if (newVal) {
      const response = await fetch(newVal)
      const blob = await response.blob()
      // 使用 Blob 创建 File 对象
      const file = new File([blob], 'filename.jpg', { type: blob.type })
      imageUrl.value = URL.createObjectURL(file)
    } else {
      imageUrl.value = ''
    }
  },
  { immediate: true },
)

const handleAvatarSuccess: UploadProps['onSuccess'] = async (response) => {
  if (getPicLink)
    getPicLink({
      index: props.index,
      link: response.imageUrl,
    })
}

// ---------------------------------------------------------------
// 自定义上传：优先传后端，后端不可用时降级成「本地 base64」
//
// 为什么要这一步：
//   原来 el-upload 直接 action="/api/upload"，只要后端没起（比如把前端单独
//   部署成静态站点做演示），上传就会 404，图片题直接变成坏块。
//   现在改成先试后端，失败就把图片读成 data URL 存在问卷数据里 —— 这样
//   纯静态部署也能完整演示图片题。
//
// 为什么能直接复用读取逻辑：
//   组件下方 watch 里是 fetch(props.value) → blob → objectURL，
//   而 fetch() 对 data URL 同样有效，所以存 base64 不用改任何读取代码。
//
// 代价：base64 会撑大问卷 JSON，所以 beforeAvatarUpload 里 2MB 的限制要保留。
// ---------------------------------------------------------------
const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const customUpload: UploadProps['httpRequest'] = async (options) => {
  const file = options.file as File
  try {
    const form = new FormData()
    form.append('image', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!data?.imageUrl) throw new Error('返回体缺少 imageUrl')
    handleAvatarSuccess({ imageUrl: data.imageUrl })
  } catch (err) {
    // 后端不可用 → 本地转 base64，保证演示不中断
    console.warn('[PicItem] 后端上传不可用，降级为本地存储：', err)
    try {
      const dataUrl = await readAsDataURL(file)
      handleAvatarSuccess({ imageUrl: dataUrl })
      ElMessage.success('已保存到本地（演示模式）')
    } catch (readErr) {
      console.error('[PicItem] 本地读取图片失败：', readErr)
      ElMessage.error('图片处理失败，请重试')
    }
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('上传图片不能超过2MB!')
    return false
  }
  return true
}
</script>

<style scoped>
.container {
  width: 200px;
  height: 300px;
  border: 1px solid var(--font-color-lightest);
  border-radius: var(--border-radius-md);
  color: var(--font-color-light);
  > .top {
    width: 100%;
    height: 200px;
    background-color: var(--font-color-lightest);
  }
  > .bottom {
    height: 100px;
    font-size: var(--font-size-lg);
    > .desc {
      font-size: var(--font-size-base);
      color: var(--font-color-light);
    }
  }
}
.avatar {
  width: 200px;
  height: 200px;
  object-fit: contain;
}
</style>
