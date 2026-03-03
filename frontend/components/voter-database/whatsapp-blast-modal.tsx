"use client"

import { useState } from "react"
import { Send, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WhatsAppBlastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientCount: number
}

export function WhatsAppBlastModal({
  open,
  onOpenChange,
  recipientCount,
}: WhatsAppBlastModalProps) {
  const [beforeMsg, setBeforeMsg] = useState("")
  const [afterMsg, setAfterMsg] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  function handleSend() {
    // In production this would call a WhatsApp API
    alert(
      `WhatsApp blast queued for ${recipientCount} voters.\n\nBefore: ${beforeMsg}\nAfter: ${afterMsg}\nImage: ${imageUrl || "None"}`
    )
    onOpenChange(false)
    setBeforeMsg("")
    setAfterMsg("")
    setImageUrl("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            WhatsApp Blast Campaign
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send a "Before & After" message to{" "}
            <span className="font-mono font-semibold text-primary">
              {recipientCount.toLocaleString()}
            </span>{" "}
            filtered voters.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="before-msg" className="text-xs text-muted-foreground">
              Before Message
            </Label>
            <Textarea
              id="before-msg"
              placeholder="Describe the problem or previous state..."
              value={beforeMsg}
              onChange={(e) => setBeforeMsg(e.target.value)}
              className="min-h-[80px] text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="after-msg" className="text-xs text-muted-foreground">
              After Message
            </Label>
            <Textarea
              id="after-msg"
              placeholder="Describe the improvement or current state..."
              value={afterMsg}
              onChange={(e) => setAfterMsg(e.target.value)}
              className="min-h-[80px] text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-url" className="text-xs text-muted-foreground">
              Attach Image URL (optional)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!beforeMsg.trim() || !afterMsg.trim()}
            className="gap-1.5 text-xs"
          >
            <Send className="size-3" />
            Send to {recipientCount.toLocaleString()} Voters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
