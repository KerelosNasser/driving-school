'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, PlusCircle, XCircle } from 'lucide-react';
import { useEditMode } from '@/app/layout';
import { EditableText } from '@/components/ui/editable-text';
import { Button } from '@/components/ui/button';

interface Service {
  name: string;
}

interface ServiceItemProps {
  name: string;
  onNameChange: (value: string) => void;
  onRemove: () => void;
}

const ServiceItem = ({ name, onNameChange, onRemove }: ServiceItemProps) => {
  const { isEditMode } = useEditMode();

  return (
    <motion.li 
      className="flex items-center" 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
      <EditableText tagName="span" onSave={onNameChange} className="text-gray-700">
        {name}
      </EditableText>
      {isEditMode && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-6 w-6 text-red-500 hover:text-red-700"
          onClick={onRemove}
        >
          <XCircle />
        </Button>
      )}
    </motion.li>
  );
};

interface ServicesProps {
  title?: string;
  services?: Service[];
}

const defaultServices: Service[] = [
  { name: 'Standard driving lessons' },
  { name: 'Intensive driving courses' },
  { name: 'Pass Plus scheme' },
  { name: 'Motorway driving tuition' },
  { name: 'Refresher courses' },
  { name: 'Theory test preparation' },
];

export function Services({ 
  title: initialTitle = 'Our Services',
  services: initialServices = defaultServices,
}: ServicesProps) {
  const { isEditMode } = useEditMode();
  const [title, setTitle] = useState(initialTitle);
  const [services, setServices] = useState(initialServices);

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...services];
    newServices[index] = { name: value };
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { name: 'New Service' }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <EditableText 
            tagName="h2" 
            className="text-3xl font-bold text-gray-900 sm:text-4xl"
            onSave={setTitle}
          >
            {title}
          </EditableText>
        </div>
        <div className="max-w-3xl mx-auto">
          <ul className="space-y-4">
            {services.map((service, index) => (
              <ServiceItem 
                key={index} 
                name={service.name} 
                onNameChange={(value) => handleServiceChange(index, value)}
                onRemove={() => removeService(index)}
              />
            ))}
          </ul>
          {isEditMode && (
            <div className="text-center mt-8">
              <Button onClick={addService}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}