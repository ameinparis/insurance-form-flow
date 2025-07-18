import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Home, Heart, Shield } from "lucide-react"
import { Link } from "react-router-dom"

const Calculate = () => {
  const options = [
    {
      id: "auto",
      title: "Auto Insurance",
      description: "Comprehensive vehicle insurance coverage",
      icon: Car,
      color: "bg-blue-500"
    },
    {
      id: "home",
      title: "Home Insurance",
      description: "Protect your home and belongings",
      icon: Home,
      color: "bg-green-500"
    },
    {
      id: "health",
      title: "Health Insurance",
      description: "Medical and health coverage plans",
      icon: Heart,
      color: "bg-red-500"
    },
    {
      id: "life",
      title: "Life Insurance",
      description: "Life protection and savings plans",
      icon: Shield,
      color: "bg-purple-500"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Calculate Insurance</h2>
        <p className="text-muted-foreground">Choose an insurance type to get started with your calculation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <Card key={option.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${option.color} text-white`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to={`/calculate/${option.id}`}>
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