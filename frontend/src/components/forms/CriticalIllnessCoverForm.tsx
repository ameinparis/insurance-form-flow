import { Card, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

const CriticalIllnessCoverForm = () => {
  return (
    <Card className="w-full">
      <CardContent className="py-20">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#009fe3]/20 blur-3xl rounded-full" />
            <div className="relative bg-[#009fe3]/10 p-8 rounded-full border-2 border-[#009fe3]/30">
              <Construction className="h-16 w-16 text-[#009fe3]" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Form Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              We're working hard to bring you the Critical Illness Cover calculator.
              Please check back soon.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CriticalIllnessCoverForm
