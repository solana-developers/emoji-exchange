use anchor_lang::prelude::*;


/*
* Initialize a new PDA account to store the balance of an emoji
*/
pub fn create_emoji_account(
    ctx: Context<CreateEmoji>, 
    account_type_seed: String,
    emoji_seed: String,
    starting_balance: u32,
) -> Result<()> {
    
    let emoji_account = &mut ctx.accounts.emoji_account;
    emoji_account.name = emoji_seed;
    emoji_account.balance = starting_balance;
    msg!("Request to create {} PDA {}", &account_type_seed, &emoji_account.key());
    msg!("Success.");
    
    Ok(())
}

/*
* Accounts context for creating a new emoji PDA account.
*/
#[derive(Accounts)]
#[instruction(
    account_type_seed: String,
    emoji_seed: String,
)]
pub struct CreateEmoji<'info> {
    #[account(
        init, 
        payer = wallet, 
        space = 8 + 40,
        seeds = [
            wallet.key().as_ref(),
            account_type_seed.as_ref(), 
            emoji_seed.as_ref()
        ],
        bump
    )]
    pub emoji_account: Account<'info, Emoji>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/*
* Emoji PDA account data.
*/
#[account]
pub struct Emoji {
    pub name: String,
    pub balance: u32,
}