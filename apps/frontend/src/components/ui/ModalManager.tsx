import { useModalStore } from '../../stores/modalStore'
import { SuccessOverlay } from './SuccessOverlay'

export function ModalManager() {
  const { current, payload, close } = useModalStore()

  return (
    <SuccessOverlay
      isVisible={current === 'txSuccess'}
      title={payload?.title}
      message={payload?.message}
      onClose={close}
    />
  )
}
