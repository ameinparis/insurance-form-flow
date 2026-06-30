import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, UserCheck, RefreshCw, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  convertQuoteToPolicy,
  generatePolicyNumber,
} from "@/lib/clientStore"
import { QuoteData } from "@/lib/quoteUtils"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  quote: QuoteData | null
  scenarioId?: string
  onDone?: () => void
}

export const PolicyDetailsDialog = ({
  open,
  onOpenChange,
  quote,
  scenarioId,
  onDone,
}: Props) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const initialIdNumber = useMemo(
    () => quote?.client?.idNumber || quote?.idNumber || "",
    [quote]
  )

  const [idNumber, setIdNumber] = useState(initialIdNumber)
  const [gender, setGender] = useState<string>("")
  const [country, setCountry] = useState("")
  const [tin, setTin] = useState("")
  const [policyNumber, setPolicyNumber] = useState(generatePolicyNumber())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setIdNumber(initialIdNumber)
      setGender("")
      setCountry("")
      setTin("")
      setPolicyNumber(generatePolicyNumber())
      setSubmitting(false)
    }
  }, [open, initialIdNumber])

  const canSubmit =
    idNumber.trim() && gender && country.trim() && tin.trim() && !submitting

  const handleSubmit = async () => {
    if (!quote || !canSubmit) return
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 900))
      const { client, policy } = convertQuoteToPolicy(quote, scenarioId, {
        idNumber: idNumber.trim(),
        gender,
        countryOfOrigin: country.trim(),
        tin: tin.trim(),
        policyNumber,
      })
      toast({
        title: "Policy created",
        description: `Draft policy ${policy.policyNumber} created for ${client.fullName}.`,
      })
      onOpenChange(false)
      onDone?.()
      navigate(`/clients/${client.id}`)
    } catch (err) {
      console.error(err)
      toast({
        title: "Conversion failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capture Policy Holder Details</DialogTitle>
          <DialogDescription>
            Add the remaining KYC information to create the draft policy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#009fe3]/10 flex items-center justify-center">
              <Hash className="h-4 w-4 text-[#009fe3]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Policy Number (auto-generated)
              </p>
              <p className="text-sm font-semibold truncate">{policyNumber}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPolicyNumber(generatePolicyNumber())}
              disabled={submitting}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Regenerate
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pd-id">ID Number</Label>
            <Input
              id="pd-id"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. 123456789"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={setGender}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pd-country">Country of Origin</Label>
              <Input
                id="pd-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Botswana"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pd-tin">Tax Identification Number (TIN)</Label>
            <Input
              id="pd-tin"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="e.g. 1234567890"
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#163144] hover:bg-[#163144]/90 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Policy...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Create Draft Policy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
