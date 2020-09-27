import axios from 'axios'
import { defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const q = ref('')

const totalFileCount = ref(0)

export const id = ref('')

export const router = useRouter()

export const elDrawer = ref(null as (HTMLElement & {
  open: boolean;
}) | null)

export const elList = ref(null as (HTMLElement & {
  select(i: number): void;
}) | null)

export const newFile = () => {
  if (elList.value) {
    elList.value.select(-1)
  }

  id.value = ''
  router.push('/')
}

export const filelist = ref([] as {
  id: string;
  title: string;
}[])

export const queryMore = async () => {
  const { value: currentList } = filelist

  const { data } = await axios.get<{
    result: {
      id: string;
      title: string;
    }[];
    count: number;
  }>('/api/entry/q', {
    params: {
      q: q.value,
      after: currentList[currentList.length - 1]
    }
  })

  totalFileCount.value = data.count
  filelist.value = [
    ...filelist.value,
    ...data.result
  ]

  return data.count
}

export default defineComponent({
  setup () {
    onMounted(() => {
      if (elList.value) {
        elList.value.addEventListener('scroll', ({ target }) => {
          const el = target as HTMLElement
          if (el.offsetHeight + el.scrollTop > el.scrollHeight - 100) {
            queryMore()
          }
        })
      }
    })

    return {
      q,
      filelist,
      elList,
      elDrawer,
      async doQuery () {
        filelist.value = []
        await queryMore()

        setTimeout(() => {
          if (!id.value || !elList.value) {
            return
          }

          const focusedItem = filelist.value.find((el) => el.id === id.value)
          const i = focusedItem ? filelist.value.indexOf(focusedItem) : -1

          if (i !== -1) {
            elList.value.select(i)
          }
        }, 100)
      },
      openFile (selectedId: string) {
        id.value = selectedId
        router.push({
          path: '/',
          query: {
            id: selectedId
          }
        })
      },
      async deleteFile (selectedId: string) {
        await axios.delete('/api/entry', {
          params: {
            id: selectedId
          }
        })

        if (!elList.value) {
          newFile()
          return
        }

        const focusedItem = filelist.value.find((el) => el.id === selectedId)
        const i = focusedItem ? filelist.value.indexOf(focusedItem) : -1

        if (i !== -1) {
          filelist.value = [
            ...filelist.value.slice(0, i),
            ...filelist.value.slice(i + 1)
          ]

          if (i >= filelist.value.length) {
            elList.value.select(0)
          } else {
            elList.value.select(i)
          }

          return
        }

        newFile()
      }
    }
  }
})
