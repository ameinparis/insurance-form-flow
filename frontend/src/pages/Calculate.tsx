import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Heart, 
  Shield, 
  Users, 
  CreditCard, 
  Activity, 
  UserCheck, 
  User 
} from "lucide-react"
import { Link } from "react-router-dom"

const Calculate = () => {
  const options = [
    {
      id: "life-funeral",
      title: "Life Funeral Quotation",
      description: "Comprehensive funeral insurance coverage",
      icon: Heart,
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      id: "living-annuities",
      title: "Living Annuities Quotation",
      description: "Retirement income planning solutions",
      icon: Shield,
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      id: "group-life-assurance",
      title: "Group Life Assurance (GLA)",
      description: "Employee group life insurance coverage",
      icon: Users,
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      id: "credit-life",
      title: "Credit Life Cover",
      description: "Protection for outstanding credit balances",
      icon: CreditCard,
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      id: "critical-illness",
      title: "Critical Illness Cover",
      description: "Financial protection against serious illnesses",
      icon: Activity,
      color: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      id: "occupational-disability",
      title: "Occupational Disability",
      description: "Income protection for work-related disabilities",
      icon: UserCheck,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    },
    {
      id: "individual-life",
      title: "Individual Life Cover",
      description: "Personal life insurance protection",
      icon: User,
      color: "bg-gradient-to-br from-teal-500 to-teal-600"
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Calculate Insurance</h2>
        <p className="text-muted-foreground">Choose an insurance type to get started with your calculation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <Card key={option.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-full ${option.color} text-white shadow-lg`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{option.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">{option.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5">
                <Link to={`/calculator/${option.id}`}>
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Calculate