import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { BusinessPhone, BusinessEmail, BusinessAddress } from "@/components/ui/global-editable-text";
import { EditableText } from "@/components/ui/editable-text";

export default function ContactPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <EditableText
                      contentKey="contact_page_title"
                      tagName="h1"
                      className="text-4xl md:text-5xl font-bold text-gray-900"
                      placeholder="Contact Us"
                  >
                    Contact Us
                  </EditableText>
                  <EditableText
                      contentKey="contact_page_subtitle"
                      tagName="p"
                      className="mt-4 text-lg text-gray-600"
                      placeholder="We'd love to hear from you! Whether you have a question about our packages, need assistance with booking, or just want to say hello, feel free to reach out."
                      multiline={true}
                      maxLength={300}
                  >
                    We'd love to hear from you! Whether you have a question about our packages, need assistance
                    with booking, or just want to say hello, feel free to reach out.
                  </EditableText>
                </div>

                <div className="space-y-4">
                  {/* Phone Contact */}
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Phone</h3>
                      <a
                          href={`tel:${undefined}`} // Will be populated by global content
                          className="text-gray-600 hover:text-yellow-600"
                      >
                        <BusinessPhone />
                      </a>
                    </div>
                  </div>

                  {/* Email Contact */}
                  <div className="flex items-center space-x-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Email</h3>
                      <a
                          href={`mailto:${undefined}`} // Will be populated by global content
                          className="text-gray-600 hover:text-yellow-600"
                      >
                        <BusinessEmail />
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Address</h3>
                      <div className="text-gray-600">
                        <BusinessAddress />
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Operating Hours</h3>
                    <div className="text-gray-600">
                      <EditableText
                          contentKey="operating_days"
                          tagName="div"
                          className="font-medium"
                          placeholder="Monday - Sunday"
                      >
                        Monday - Sunday
                      </EditableText>
                      <EditableText
                          contentKey="operating_hours"
                          tagName="div"
                          placeholder="7:00 AM - 7:00 PM"
                      >
                        7:00 AM - 7:00 PM
                      </EditableText>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    <EditableText
                        contentKey="contact_form_title"
                        tagName="span"
                        placeholder="Send a Message"
                    >
                      Send a Message
                    </EditableText>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        <EditableText
                            contentKey="contact_form_name_label"
                            tagName="span"
                            placeholder="Name"
                        >
                          Name
                        </EditableText>
                      </Label>
                      <Input
                          id="name"
                          type="text"
                          placeholder="Your Name"
                          className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        <EditableText
                            contentKey="contact_form_email_label"
                            tagName="span"
                            placeholder="Email"
                        >
                          Email
                        </EditableText>
                      </Label>
                      <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        <EditableText
                            contentKey="contact_form_phone_label"
                            tagName="span"
                            placeholder="Phone (Optional)"
                        >
                          Phone (Optional)
                        </EditableText>
                      </Label>
                      <Input
                          id="phone"
                          type="tel"
                          placeholder="Your phone number"
                          className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                        <EditableText
                            contentKey="contact_form_subject_label"
                            tagName="span"
                            placeholder="Subject"
                        >
                          Subject
                        </EditableText>
                      </Label>
                      <Input
                          id="subject"
                          type="text"
                          placeholder="What's this about?"
                          className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                        <EditableText
                            contentKey="contact_form_message_label"
                            tagName="span"
                            placeholder="Message"
                        >
                          Message
                        </EditableText>
                      </Label>
                      <Textarea
                          id="message"
                          placeholder="How can we help you?"
                          className="mt-1"
                          rows={5}
                      />
                    </div>

                    <div>
                      <Button type="submit" className="w-full">
                        <EditableText
                            contentKey="contact_form_submit_button"
                            tagName="span"
                            placeholder="Send Message"
                        >
                          Send Message
                        </EditableText>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information Section */}
            <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <EditableText
                    contentKey="contact_additional_title"
                    tagName="h2"
                    className="text-2xl font-bold text-gray-900"
                    placeholder="Get Started Today"
                >
                  Get Started Today
                </EditableText>
                <EditableText
                    contentKey="contact_additional_subtitle"
                    tagName="p"
                    className="mt-4 text-lg text-gray-600"
                    placeholder="Ready to start your driving journey? We're here to help you every step of the way."
                    multiline={true}
                >
                  Ready to start your driving journey? We're here to help you every step of the way.
                </EditableText>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    <EditableText
                        contentKey="contact_cta_phone_title"
                        tagName="span"
                        placeholder="Call Us"
                    >
                      Call Us
                    </EditableText>
                  </h3>
                  <EditableText
                      contentKey="contact_cta_phone_desc"
                      tagName="p"
                      className="text-gray-600"
                      placeholder="Speak directly with our friendly team"
                      multiline={true}
                  >
                    Speak directly with our friendly team
                  </EditableText>
                </div>

                <div className="text-center">
                  <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    <EditableText
                        contentKey="contact_cta_email_title"
                        tagName="span"
                        placeholder="Email Us"
                    >
                      Email Us
                    </EditableText>
                  </h3>
                  <EditableText
                      contentKey="contact_cta_email_desc"
                      tagName="p"
                      className="text-gray-600"
                      placeholder="Send us your questions anytime"
                      multiline={true}
                  >
                    Send us your questions anytime
                  </EditableText>
                </div>

                <div className="text-center">
                  <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    <EditableText
                        contentKey="contact_cta_location_title"
                        tagName="span"
                        placeholder="Meet In Person"
                    >
                      Meet In Person
                    </EditableText>
                  </h3>
                  <EditableText
                      contentKey="contact_cta_location_desc"
                      tagName="p"
                      className="text-gray-600"
                      placeholder="We serve the greater Brisbane area"
                      multiline={true}
                  >
                    We serve the greater Brisbane area
                  </EditableText>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}