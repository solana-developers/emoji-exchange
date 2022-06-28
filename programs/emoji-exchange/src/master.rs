use anchor_lang::prelude::*;

use crate::EMOJI_STARTING_PRICE;


/*
* Initialize a new PDA account to store the balance of an emoji
*/
pub fn create_master_emoji_account(
    ctx: Context<CreateMasterEmoji>, 
    emoji_seed: String,
    starting_balance: u32,
    authority: Pubkey,
) -> Result<()> {
    
    let emoji_account = &mut ctx.accounts.emoji_account;
    emoji_account.name = emoji_seed;
    emoji_account.balance = starting_balance;
    emoji_account.authority = authority;

    let emoji_price_account = &mut ctx.accounts.emoji_price_account;
    emoji_price_account.price = EMOJI_STARTING_PRICE;

    msg!("Request to create _master_ PDA {}", &emoji_account.key());
    msg!("Success.");
    
    Ok(())
}

/*
* Accounts context for creating a new emoji PDA account.
*/
#[derive(Accounts)]
#[instruction(emoji_seed: String)]
pub struct CreateMasterEmoji<'info> {
    #[account(
        init, 
        payer = wallet, 
        space = 82,
        seeds = [
            wallet.key().as_ref(),
            b"_master_", 
            emoji_seed.as_ref()
        ],
        bump
    )]
    pub emoji_account: Account<'info, MasterEmoji>,
    #[account(
        init, 
        payer = wallet, 
        space = 82,
        seeds = [
            wallet.key().as_ref(),
            b"_price_", 
            emoji_seed.as_ref()
        ],
        bump
    )]
    pub emoji_price_account: Account<'info, EmojiPrice>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/*
* Emoji PDA account data.
*/
#[account]
pub struct MasterEmoji {
    pub name: String,
    pub balance: u32,
    pub authority: Pubkey
}

/*
* Emoji price PDA account data.
*/
#[account]
pub struct EmojiPrice {
    pub name: String,
    pub price: u64,
}