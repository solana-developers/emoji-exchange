use anchor_lang::prelude::*;


/*
* Initialize a new PDA account to store the user's metadata
*/
pub fn create_user_metadata_account(
    ctx: Context<CreateUserMetadata>, 
    username: String,
    authority: Pubkey,
) -> Result<()> {
    
    let metadata_account = &mut ctx.accounts.metadata_account;
    metadata_account.username = username;
    metadata_account.authority = authority;
    msg!("Request to create _usermetadata_ PDA {}", &metadata_account.key());
    msg!("Success.");
    
    Ok(())
}

/*
* Accounts context for creating a new metadata PDA account.
*/
#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUserMetadata<'info> {
    #[account(
        init, 
        payer = wallet, 
        space = 82,
        seeds = [
            wallet.key().as_ref(),
            b"_usermetadata_", 
            username.as_ref()
        ],
        bump
    )]
    pub metadata_account: Account<'info, UserMetadata>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/*
* Metadata PDA account data.
*/
#[account]
pub struct UserMetadata {
    pub username: String,
    pub authority: Pubkey
}


/*
* Initialize a new PDA account to store the balance of an emoji
*/
pub fn create_user_emoji_account(
    ctx: Context<CreateUserEmoji>, 
    emoji_seed: String,
    authority: Pubkey,
) -> Result<()> {
    
    let emoji_account = &mut ctx.accounts.emoji_account;
    emoji_account.name = emoji_seed;
    emoji_account.balance = 0;
    emoji_account.authority = authority;
    msg!("Request to create _user_ PDA {}", &emoji_account.key());
    msg!("Success.");
    
    Ok(())
}

/*
* Accounts context for creating a new emoji PDA account.
*/
#[derive(Accounts)]
#[instruction(emoji_seed: String)]
pub struct CreateUserEmoji<'info> {
    #[account(
        init, 
        payer = wallet, 
        space = 82,
        seeds = [
            wallet.key().as_ref(),
            b"_user_", 
            emoji_seed.as_ref()
        ],
        bump
    )]
    pub emoji_account: Account<'info, UserEmoji>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/*
* Emoji PDA account data.
*/
#[account]
pub struct UserEmoji {
    pub name: String,
    pub balance: u32,
    pub authority: Pubkey
}