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
      id: "living-annuities",
      title: "Living Annuities Quotation",
      description: "Retirement income planning solutions",
      icon: Shield,
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      id: "life-funeral",
      title: "Life Funeral Quotation",
      description: "Comprehensive funeral insurance coverage",
      icon: Heart,
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {options.map((option) => (
          <Link key={option.id} to={`/calculator/${option.id}`}>
            <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                {/* Circular Icon */}
                <div className={`h-20 w-20 rounded-full ${option.color} flex items-center justify-center shadow-lg`}>
                  <option.icon className="h-10 w-10 text-white" />
                </div>
                
                {/* Title */}
                <CardTitle className="text-lg font-bold text-foreground">
                  {option.title}
                </CardTitle>
                
                {/* Description */}
                <CardDescription className="text-sm text-muted-foreground">
                  {option.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Calculate