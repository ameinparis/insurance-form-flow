import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import LifeFuneralQuotationForm from "./forms/LifeFuneralQuotationForm"
import LivingAnnuitiesQuotationForm from "./forms/LivingAnnuitiesQuotationForm"
import CreditLifeCoverForm from "./forms/CreditLifeCoverForm"
import GroupLifeAssuranceForm from "./forms/GroupLifeAssuranceForm"
import IndividualLifeCoverForm from "./forms/IndividualLifeCoverForm"

const FormRouter = () => {
  const { type } = useParams()
  const navigate = useNavigate()

  const getFormTitle = () => {
    switch (type) {
      case "life-funeral":
        return "Life Funeral Insurance"
      case "living-annuities":
        return "Living Annuities"
      case "group-life-assurance":
        return "Group Life Assurance"
      case "individual-life-cover":
        return "Individual Life Cover"
      case "home":
        return "Home Insurance"
      case "health":
        return "Health Insurance"
      default:
        return "Insurance Calculator"
    }
  }

  const renderForm = () => {
    switch (type) {
      case "life-funeral":
        return <LifeFuneralQuotationForm />
      case "living-annuities":
        return <LivingAnnuitiesQuotationForm />
      case "group-life-assurance":
        return <GroupLifeAssuranceForm />
        case "individual-life-cover":
          return <IndividualLifeCoverForm/>
      default:
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Form Coming Soon</h3>
            <p className="text-muted-foreground">
              The {getFormTitle()} calculator form is currently being developed.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/calculator")} className="rounded-full border-2 border-[#009fe3] text-[#009fe3] hover:bg-[#009fe3]/10 h-9 w-9 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{getFormTitle()}</h2>
          <p className="text-muted-foreground">Fill out the form to get your personalized quote.</p>
        </div>
      </div>

      {renderForm()}
    </div>
  )
}

export default FormRouter

