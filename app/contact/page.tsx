
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Contact Us</h1>
                <p className="mt-4 text-lg text-gray-600">
                  We'd love to hear from you! Whether you have a question about our packages, need assistance with booking, or just want to say hello, feel free to reach out.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Phone</h3>
                    <a href="tel:+61400000000" className="text-gray-600 hover:text-yellow-600">0400 000 000</a>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Email</h3>
                    <a href="mailto:info@brisbanedrivingschool.com" className="text-gray-600 hover:text-yellow-600">info@brisbanedrivingschool.com</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Address</h3>
                    <p className="text-gray-600">Brisbane, Queensland, Australia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input id="name" type="text" placeholder="Your Name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input id="email" type="email" placeholder="your.email@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message</Label>
                    <Textarea id="message" placeholder="How can we help you?" className="mt-1" rows={5} />
                  </div>
                  <div>
                    <Button type="submit" className="w-full">Send Message</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
