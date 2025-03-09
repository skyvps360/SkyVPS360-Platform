/**
 * Manages the system SSH key for terminal access
 * This key is used to provide access to newly created VPS instances
 */

import { storage } from "./storage";
import { SSHKey } from "@shared/schema";

export class SystemKeyManager {
  private readonly systemKeyFingerprint: string = 'c0:62:80:ae:2a:05:66:22:cb:d1:64:6e:54:c2:2c:ca';
  private readonly systemKeyName: string = 'CloudRack System Key';
  private readonly systemPublicKey: string = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDv8X23SfgYoZ0sUx3IvM3njHiAH2Q9pzyXm8ICrUAMm6J5hrdV cloudrack-system-key';

  /**
   * Checks if a user has the system SSH key registered in their account
   */
  async hasSystemKey(userId: number): Promise<boolean> {
    try {
      const userKeys = await storage.getSSHKeysByUser(userId);
      const systemKey = userKeys.find(key => 
        key.isSystemKey || // Check if key is marked as system key
        key.publicKey.includes(this.systemPublicKey) || // Check by public key
        key.name === this.systemKeyName // Check by name as fallback
      );
      
      return !!systemKey;
    } catch (error) {
      console.error(`Error checking for system SSH key: ${error}`);
      return false;
    }
  }

  /**
   * Ensures the system SSH key is added to the user's account
   * If not, it will create one automatically
   * 
   * @returns The ID of the system key, or null if failed
   */
  async ensureSystemKey(userId: number): Promise<string | null> {
    try {
      // First check if user already has the system key
      const userKeys = await storage.getSSHKeysByUser(userId);
      const systemKey = userKeys.find(key => 
        key.isSystemKey || 
        key.publicKey.includes(this.systemPublicKey) ||
        key.name === this.systemKeyName
      );
      
      if (systemKey) {
        console.log(`User ${userId} already has system key with ID: ${systemKey.id}`);
        
        // If found but not marked as system key, update it
        if (!systemKey.isSystemKey) {
          await this.updateKeyAsSystemKey(systemKey);
        }
        
        return systemKey.id.toString();
      }
      
      // If not found, create a new system key
      console.log(`Creating system key for user ${userId}`);
      const newKey = await storage.createSSHKey({
        userId,
        name: this.systemKeyName,
        publicKey: this.systemPublicKey,
        createdAt: new Date(),
        isCloudRackKey: false,
        isSystemKey: true
      });
      
      console.log(`Created system key with ID: ${newKey.id}`);
      return newKey.id.toString();
    } catch (error) {
      console.error(`Error ensuring system SSH key: ${error}`);
      return null;
    }
  }
  
  /**
   * Update a SSH key to be marked as a system key
   */
  private async updateKeyAsSystemKey(key: SSHKey): Promise<void> {
    try {
      // This is a system key but not marked as such, update it
      console.log(`Updating key ${key.id} to be marked as system key`);
      await storage.updateSSHKey(key.id, { isSystemKey: true });
    } catch (error) {
      console.error(`Error updating SSH key as system key: ${error}`);
    }
  }

  /**
   * Returns the system SSH key fingerprint
   */
  getSystemKeyFingerprint(): string {
    return this.systemKeyFingerprint;
  }

  /**
   * Returns the system SSH public key
   */
  getSystemPublicKey(): string {
    return this.systemPublicKey;
  }
}

export const systemKeyManager = new SystemKeyManager();