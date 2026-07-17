import { 
  Heart, 
  Shield, 
  Users, 
  Activity, 
  User 
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const Calculate = () => {
  const options = [
    {
      id: "living-annuities",
      title: "Living Annuities",
      description: "Retirement income planning",
      icon: Shield,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    {
      id: "life-funeral",
      title: "Life Funeral",
      description: "Funeral insurance coverage",
      icon: Heart,
      bgColor: "bg-rose-100",
      iconColor: "text-rose-600"
    },
    {
      id: "group-life-assurance",
      title: "Group Life (GLA)",
      description: "Employee group coverage",
      icon: Users,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      id: "individual-life-cover",
      title: "Individual Life Cover",
      description: "Personal life insurance",
      icon: User,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600"
    },
    {
      id: "critical-illness",
      title: "Critical Illness",
      description: "Serious illness protection",
      icon: Activity,
      bgColor: "bg-red-100",
      iconColor: "text-red-600"
    },
    
  ]

  return (
    <div className="-m-6">
      <div className="sticky top-0 z-30 bg-card px-6 pt-6 pb-4">
        <h2 className="text-3xl font-bold mb-2">Calculate Insurance</h2>
        <p className="text-muted-foreground">Choose an insurance type to get started with your calculation.</p>
      </div>
      <div className="px-6 pb-6 space-y-6">



      <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => (
            <div 
              key={option.id} 
              className="bg-muted/50 dark:bg-[hsl(225,28%,15%)] dark:border dark:border-[hsl(225,25%,22%)] rounded-2xl p-6 flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon Container */}
              <div className={`h-16 w-16 rounded-xl ${option.bgColor} flex items-center justify-center`}>
                <option.icon className={`h-8 w-8 ${option.iconColor}`} />
              </div>
              
              {/* Title */}
              <h3 className="text-base font-semibold text-foreground">
                {option.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>

              {/* View Button */}
              <Link to={`/calculator/${option.id}`} className="w-full">
                <Button variant="outline" className="w-full mt-2">
                  Calculate 
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}


export default Calculate