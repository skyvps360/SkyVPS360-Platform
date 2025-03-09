import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert } from 'lucide-react';

interface ConfirmFirewallActionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmationText?: string;
  confirmButtonText?: string;
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function ConfirmFirewallAction({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmationText = 'I Confirm',
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'destructive'
}: ConfirmFirewallActionProps) {
  const [inputText, setInputText] = useState('');
  const isConfirmEnabled = inputText === confirmationText;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm mb-2">
            This action could compromise server security. Type <strong>{confirmationText}</strong> to confirm:
          </p>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={confirmationText}
            className="mb-4"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={confirmButtonVariant} 
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
          >
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}