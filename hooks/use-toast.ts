'use client'

import * as React from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type State = {
  toasts: ToasterToast[]
}

type ToastPayload = Omit<ToasterToast, 'id'>

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function setState(nextState: State) {
  memoryState = nextState
  listeners.forEach((listener) => listener(memoryState))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      }
    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        queueToastRemoval(toastId)
      } else {
        state.toasts.forEach((toast) => queueToastRemoval(toast.id))
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toastId === undefined || toast.id === toastId
            ? {
                ...toast,
                open: false,
              }
            : toast,
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      }
    default:
      return state
  }
}

function dispatch(action: Action) {
  setState(reducer(memoryState, action))
}

function queueToastRemoval(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: 'REMOVE_TOAST', toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

function generateToastId() {
  return Math.random().toString(36).slice(2, 10)
}

function toast(payload: ToastPayload) {
  const id = generateToastId()

  const update = (toastUpdate: Partial<ToasterToast>) =>
    dispatch({ type: 'UPDATE_TOAST', toast: { id, ...toastUpdate } })

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...payload,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss()
        }
      },
    },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setLocalState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setLocalState)
    return () => {
      const index = listeners.indexOf(setLocalState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }
