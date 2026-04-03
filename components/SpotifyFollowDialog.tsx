'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type SpotifyFollowDialogProps = {
  showId: string
  buttonClassName?: string
  buttonLabel?: string
}

export default function SpotifyFollowDialog({
  showId,
  buttonClassName,
  buttonLabel = 'Follow Podcast',
}: SpotifyFollowDialogProps) {
  const followUri = encodeURIComponent(`spotify:show:${showId}`)
  const followUrl = `https://open.spotify.com/follow/1/?uri=${followUri}&size=detail&theme=dark`
  const showUrl = `https://open.spotify.com/show/${showId}`

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            buttonClassName ??
            'inline-flex items-center justify-center rounded-full border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent'
          }
        >
          {buttonLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Follow on Spotify</DialogTitle>
          <DialogDescription>
            Follow the podcast without leaving this page. You may be asked to sign in to
            Spotify.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-white/10 bg-black/90 p-3">
          <iframe
            title="Follow podcast on Spotify"
            className="w-full h-[160px] rounded-lg"
            src={followUrl}
            allow="clipboard-write; encrypted-media"
            loading="lazy"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            If the follow widget does not load, you can open Spotify in a new tab.
          </p>
          <Link
            href={showUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Open in Spotify
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
